import { useCollection } from "../../hooks/useCollections";
import { apiFetch, deleteCollectionItem } from "../../services/collections";
import { LoadingPlaceholder } from "../../components/LoadingPlaceholder";
import { useMemo, useState } from "react";
import { MonitorPlay, Plus, Search, SquarePen } from "lucide-react";
import { CourseForm } from "./CourseForm";
import type { CourseFormInitial, CourseSubmission } from "./CourseForm";
import { Card } from "../../components/Card";
import { DatePicker } from "../../components/DatePicker";
import { DefaultButton } from "../../components/DefaultButton";
import { Switch } from "../../components/FormFields";
import { FormModal } from "../../components/FormModal";
import { ProgressBar } from "../../components/ProgressBar";
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

function courseInitials(title: string) {
  const words = title.match(/[A-Za-z0-9]+/g) ?? [];
  return words.slice(0, 3).map((word) => word[0]).join("").toUpperCase() || "—";
}

function formatGoalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" })
    .format(new Date(year, month - 1, day));
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
  const response = await apiFetch(`/api/v1/courses/${path}`, {
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

export function Courses() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const { data: rawCourses, loading, error } = useCollection<CourseResponse>("courses");
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [filter, setFilter] = useState("IP");
  const [search, setSearch] = useState("");
  const [detailError, setDetailError] = useState("");
  const [detailSaving, setDetailSaving] = useState(false);

  const courses = useMemo(() => rawCourses.map(normalizeCourse), [rawCourses]);

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
    setDetailError("");
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

    setSelectedCourseId(saved.id);
    setFilter(saved.status);
    closeCourseForm();
  }

  async function updateCourseDetails(course: Course, changes: Partial<Pick<Course, "goal_date" | "certificate_available">>) {
    if (detailSaving) return;
    setDetailSaving(true);
    setDetailError("");
    try {
      await requestCourses(`${course.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
    } catch (cause) {
      setDetailError(cause instanceof Error ? cause.message : "Could not update course details.");
    } finally {
      setDetailSaving(false);
    }
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
          <DefaultButton
            size="sm"
            icon={<Plus aria-hidden="true" />}
            disabled={loading || !!error}
            onClick={() => openCourseForm()}
          >
            Add course
          </DefaultButton>
        </header>

        <Card className={styles.toolbar}>
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
          <label className={styles.searchBox}>
            <Search aria-hidden="true" />
            <input
              type="search"
              placeholder="Search your library"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </Card>

        {error && <p className={styles.error} role="alert">{error}</p>}

        {!error && (
          <div className={styles.contentGrid}>
            <section className={styles.courseList} aria-label={`${statusLabels[filter]} courses`} aria-busy={loading}>
              {loading ? (
                <div className={styles.emptyList}>
                  <LoadingPlaceholder compact />
                </div>
              ) : courses.length === 0 ? (
                <div className={styles.emptyList}>Your course library is empty. Add your first course.</div>
              ) : visibleCourses.length === 0 ? (
                <div className={styles.emptyList}>{search ? `No courses found for “${search}”.` : "No courses in this section."}</div>
              ) : visibleCourses.map((course) => {
                const total = course.number_of_lessons ?? 0;
                const courseProgress = total ? Math.min(100, Math.round(course.completed_lessons / total * 100)) : 0;
                const selected = course.id === selectedCourse?.id;
                const certificateLabel = course.certificate_obtained
                  ? "Certificate obtained"
                  : course.certificate_available ? "Certificate available" : "No certificate";
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
                      <div className={styles.courseCoverPlaceholder} aria-hidden="true">{courseInitials(course.title)}</div>
                    )}
                    <div className={styles.courseInfo}>
                      <h2>{course.title}</h2>
                      <p title={course.instructor ?? undefined}>
                        {instructorsPreview(course.instructor) || course.platform || "Course"}
                        {course.instructor && course.platform ? ` · ${course.platform}` : ""}
                      </p>
                      <div className={styles.progressRow}>
                        <ProgressBar value={course.completed_lessons} max={total || 1} className={styles.progress} />
                        <span>{course.completed_lessons} of {total || "—"} lessons</span>
                      </div>
                    </div>
                    <div className={styles.courseSide}>
                      <strong>{courseProgress}%</strong>
                      <div className={styles.chips}>
                        <span>{course.goal_date ? `Goal ${formatGoalDate(course.goal_date)}` : "No goal date"}</span>
                        <span>{certificateLabel}</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </section>

            {selectedCourse && (
              <Card className={styles.detailsCard}>
                {selectedCourse.cover ? (
                  <img className={styles.detailCover} src={selectedCourse.cover} alt={`${selectedCourse.title} cover`} />
                ) : (
                  <div className={styles.detailCoverPlaceholder} aria-hidden="true">{courseInitials(selectedCourse.title)}</div>
                )}
                <h2>{selectedCourse.title}</h2>
                <p className={styles.detailByline} title={selectedCourse.instructor ?? undefined}>
                  {[instructorsPreview(selectedCourse.instructor), selectedCourse.platform].filter(Boolean).join(" · ") || "Course"}
                </p>
                <div className={styles.detailProgressBlock}>
                  <strong>{progress}%</strong>
                  <ProgressBar value={selectedCourse.completed_lessons} max={selectedCourse.number_of_lessons || 1} className={styles.detailProgress} />
                  <span>
                    {selectedCourse.completed_lessons} of {selectedCourse.number_of_lessons ?? "—"} lessons completed
                    {selectedCourse.number_of_lessons != null && ` · ${Math.max(0, selectedCourse.number_of_lessons - selectedCourse.completed_lessons)} remaining`}
                  </span>
                </div>
                <label className={styles.detailField}>
                  <span>Goal date</span>
                  <DatePicker
                    value={selectedCourse.goal_date ?? ""}
                    disabled={detailSaving}
                    onChange={(value) => void updateCourseDetails(selectedCourse, { goal_date: value || null })}
                  />
                </label>
                <div className={detailSaving ? styles.controlPending : ""}>
                  <Switch
                    label="Certificate available"
                    description={selectedCourse.certificate_obtained ? "Certificate obtained" : undefined}
                    checked={selectedCourse.certificate_available}
                    onChange={(checked) => void updateCourseDetails(selectedCourse, { certificate_available: checked })}
                  />
                </div>
                {detailError && <p className={styles.error} role="alert">{detailError}</p>}
                <div className={styles.detailActions}>
                  <DefaultButton variant="secondary" size="sm" onClick={() => { setSelectedCourseId(null); setDetailError(""); }}>Close</DefaultButton>
                  <DefaultButton size="sm" icon={<SquarePen aria-hidden="true" />} onClick={() => openCourseForm(selectedCourse)}>Edit course</DefaultButton>
                </div>
              </Card>
            )}
            {!selectedCourse && (
              <Card className={styles.detailsCard}>
                <div className={styles.detailsHint}>
                  <MonitorPlay aria-hidden="true" />
                  <p>Select a course to see its details and edit it.</p>
                </div>
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
          onDelete={editingCourse ? async () => {
            await deleteCollectionItem("courses", editingCourse.id);
            setSelectedCourseId(null);
            closeCourseForm();
          } : undefined}
        />
      </FormModal>
    </>
  );
}
