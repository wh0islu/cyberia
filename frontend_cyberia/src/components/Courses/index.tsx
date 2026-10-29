import { useEffect, useMemo, useState } from "react";
import { Plus, Search, SquarePen } from "lucide-react";
import { CourseForm } from "../../forms";
import type { CourseFormInitial, CourseSubmission } from "../../forms/CourseForm";
import { Card } from "../Card";
import { DefaultButton } from "../DefaultButton";
import { FormModal } from "../FormModal";
import { ProgressBar } from "../ProgressBar";
import styles from "./styles.module.css";

type Course = {
  id: number;
  title: string;
  instructor: string | null;
  platform: string | null;
  number_of_lessons: number | null;
  completed_lessons: number;
  goal_date: string | null;
  status: string;
  cover: string | null;
  certificate_available: boolean;
  certificate_obtained: boolean;
  modules: string[];
  sources: { format: string; location: string | null; url: string | null }[];
};

type CourseResponse = Omit<Course, "modules"> & { modules: unknown };

function normalizeCourse(course: CourseResponse): Course {
  let modules = course.modules;
  if (typeof modules === "string") {
    try {
      modules = JSON.parse(modules);
    } catch {
      modules = [];
    }
  }
  return {
    ...course,
    modules: Array.isArray(modules)
      ? modules.filter((module): module is string => typeof module === "string")
      : [],
  };
}

const statusLabels: Record<string, string> = {
  NS: "Queued",
  IP: "In progress",
  CD: "Completed",
  PA: "Paused",
  RY: "Reviewing",
};

function instructorsPreview(instructors: string | null) {
  if (!instructors) return "";
  const names = instructors.split(",").map((name) => name.trim()).filter(Boolean);
  return names.length > 2 ? `${names.slice(0, 2).join(", ")}…` : instructors;
}

function getErrorMessage(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(getErrorMessage).join(" ");
  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([field, error]) => `${field}: ${getErrorMessage(error)}`)
      .join("; ");
  }
  return "Unable to complete request.";
}

async function requestCourses(path = "", options: RequestInit = {}) {
  const csrf = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("csrftoken="))
    ?.split("=")[1];
  const response = await fetch(`/api/v1/courses/${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(csrf ? { "X-CSRFToken": decodeURIComponent(csrf) } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data ? getErrorMessage(data) : `Request failed (${response.status}).`);
  }
  return data;
}

export function Courses({ onCollectionChange }: { onCollectionChange?: () => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [filter, setFilter] = useState("IP");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    requestCourses()
      .then((data: CourseResponse[]) => {
        if (!active) return;
        setCourses(data.map(normalizeCourse));
      })
      .catch((requestError: Error) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const visibleCourses = useMemo(
    () => courses.filter((course) =>
      course.status === filter &&
      `${course.title} ${course.instructor ?? ""} ${course.platform ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    ),
    [courses, filter, search],
  );
  const selectedCourse = visibleCourses.find((course) => course.id === selectedCourseId) ?? null;

  function openCourseForm(course: Course | null = null) {
    setEditingCourse(course);
    setIsModalOpen(true);
  }

  function closeCourseForm() {
    setIsModalOpen(false);
    setEditingCourse(null);
  }

  function getCourseFormInitial(course: Course): CourseFormInitial {
    return {
      title: course.title,
      platform: course.platform ?? "",
      instructor: course.instructor ?? "",
      status: course.status,
      total_lessons: String(course.number_of_lessons ?? ""),
      done_lessons: String(course.completed_lessons),
      goal_date: course.goal_date ?? "",
      certificate: course.certificate_available,
      modules: course.modules,
      sources: course.sources?.map((source) => ({
        format: source.format,
        location: source.location ?? "",
        url: source.url ?? "",
      })) ?? [],
    };
  }

  async function handleSaveCourse(data: CourseSubmission) {
    const body = new FormData();
    body.append("title", data.title);
    body.append("instructor", data.instructor);
    body.append("platform", data.platform);
    body.append("status", data.status);
    body.append("number_of_lessons", String(data.total_lessons));
    body.append("completed_lessons", String(data.done_lessons));
    if (data.goal_date || editingCourse) body.append("goal_date", data.goal_date ?? "");
    body.append("certificate_available", String(data.certificate));
    body.append("modules", JSON.stringify(data.modules));
    body.append("sources", JSON.stringify(data.sources));
    if (data.image) body.append("cover", data.image);

    const saved = normalizeCourse(await requestCourses(
      editingCourse ? `${editingCourse.id}/` : "",
      { method: editingCourse ? "PATCH" : "POST", body },
    ));
    setCourses((previousCourses) => editingCourse
      ? previousCourses.map((course) => course.id === saved.id ? saved : course)
      : [...previousCourses, saved]);
    if (!editingCourse) onCollectionChange?.();
    setSelectedCourseId(saved.id);
    setFilter(saved.status);
    closeCourseForm();
  }

  const progress = selectedCourse?.number_of_lessons
    ? Math.min(100, Math.round(selectedCourse.completed_lessons / selectedCourse.number_of_lessons * 100))
    : 0;
  const statusCounts = Object.fromEntries(
    Object.keys(statusLabels).map((status) => [status, courses.filter((course) => course.status === status).length]),
  );

  return (
    <>
      <main className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1>Courses</h1>
            <p>
              {statusCounts.IP ?? 0} in progress · {statusCounts.CD ?? 0} completed · {courses.length} total
            </p>
          </div>
          <div className={styles.headerActions}>
            <label className={styles.searchBox}>
              <Search aria-hidden="true" />
              <input
                type="search"
                placeholder="Search your library"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <DefaultButton
              size="sm"
              icon={<Plus aria-hidden="true" />}
              disabled={loading || !!error}
              onClick={() => openCourseForm()}
            >
              Add course
            </DefaultButton>
          </div>
        </header>

        <Card className={styles.tabsCard}>
          <nav className={styles.tabs} aria-label="Filter courses">
            {["IP", "CD", "NS", "PA", "RY"].map((status) => (
              <button
                type="button"
                key={status}
                className={filter === status ? styles.activeTab : undefined}
                aria-pressed={filter === status}
                onClick={() => {
                  setFilter(status);
                  setSelectedCourseId(null);
                }}
              >
                {statusLabels[status]} ({statusCounts[status] ?? 0})
              </button>
            ))}
          </nav>
        </Card>

        {loading && <p role="status">Loading courses...</p>}
        {error && <p role="alert">{error}</p>}
        {!loading && !error && courses.length === 0 && <p>Your course library is empty. Add your first course.</p>}

        {!loading && !error && courses.length > 0 && (
          <div className={styles.contentGrid}>
            <Card className={styles.courseList} aria-label={`${statusLabels[filter]} courses`}>
              {visibleCourses.length === 0 ? (
                <p>No courses in this section match your search.</p>
              ) : visibleCourses.map((course) => {
                const total = course.number_of_lessons ?? 0;
                const courseProgress = total ? Math.min(100, Math.round(course.completed_lessons / total * 100)) : 0;
                const selected = course.id === selectedCourse?.id;
                return (
                  <Card
                    as="article"
                    key={course.id}
                    className={`${styles.courseCard} ${selected ? styles.selectedCourse : ""}`}
                  >
                    <button
                      type="button"
                      className={styles.courseSelect}
                      aria-label={`Show details for ${course.title}`}
                      aria-pressed={selected}
                      onClick={() => setSelectedCourseId(course.id)}
                    />
                    {course.cover ? (
                      <img className={styles.courseCover} src={course.cover} alt={`${course.title} cover`} loading="lazy" />
                    ) : (
                      <div className={styles.courseCoverPlaceholder} aria-hidden="true">{course.title.slice(0, 1)}</div>
                    )}
                    <div className={styles.courseInfo}>
                      <div className={styles.courseTitleRow}>
                        <h2>{course.title}</h2>
                        <strong>{courseProgress}%</strong>
                      </div>
                      <p title={course.instructor ?? undefined}>
                        {instructorsPreview(course.instructor) || course.platform || "Course"}
                        {course.instructor && course.platform ? ` · ${course.platform}` : ""}
                      </p>
                      <ProgressBar value={course.completed_lessons} max={total || 1} className={styles.progress} />
                      <div className={styles.courseMeta}>
                        <span>Lesson {course.completed_lessons} of {total || "—"}</span>
                        <span>
                          {course.goal_date ? `Goal: ${course.goal_date}` : "No goal date"}
                          {` · certificate: ${course.certificate_available ? "yes" : "no"}`}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </Card>

            {selectedCourse && (
              <Card className={styles.detailsCard}>
                <div className={styles.detailsHeader}>
                  <span className={styles.detailLabel}>Details</span>
                  <DefaultButton
                    size="sm"
                    variant="secondary"
                    icon={<SquarePen size={14} aria-hidden="true" />}
                    onClick={() => openCourseForm(selectedCourse)}
                  >
                    Edit
                  </DefaultButton>
                </div>
                <h2>{selectedCourse.title}</h2>
                {selectedCourse.instructor && <p title={selectedCourse.instructor}>{instructorsPreview(selectedCourse.instructor)}</p>}
                <ProgressBar
                  value={selectedCourse.completed_lessons}
                  max={selectedCourse.number_of_lessons || 1}
                  className={styles.detailProgress}
                />
                <p className={styles.detailProgressText}>
                  {selectedCourse.completed_lessons} of {selectedCourse.number_of_lessons ?? "—"} lessons · {progress}%
                </p>
                {selectedCourse.modules.length > 0 && (
                  <div className={styles.modules}>
                    {selectedCourse.modules.map((module, index) => (
                      <div className={styles.module} key={`${module}-${index}`}>
                        <span className={styles.moduleCheck} aria-hidden="true" />
                        <span>{module}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
            {!selectedCourse && visibleCourses.length > 0 && (
              <Card className={styles.detailsCard}>
                <p className={styles.detailsHint}>Select a course to see its details and edit it.</p>
              </Card>
            )}
          </div>
        )}
      </main>

      <FormModal
        open={isModalOpen}
        title={editingCourse ? "Edit course" : "Add course"}
        description={editingCourse ? "Update this course in your library." : "Add a course and track your progress through its lessons."}
        onClose={closeCourseForm}
      >
        <CourseForm
          key={editingCourse?.id ?? "new-course"}
          initial={editingCourse ? getCourseFormInitial(editingCourse) : undefined}
          coverUrl={editingCourse?.cover}
          onSubmit={handleSaveCourse}
          onCancel={closeCourseForm}
        />
      </FormModal>
    </>
  );
}
