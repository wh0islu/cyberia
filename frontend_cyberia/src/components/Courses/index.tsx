import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { CourseForm } from "../../forms";
import { Card } from "../Card";
import { DefaultButton } from "../DefaultButton";
import { FormModal } from "../FormModal";
import { ProgressBar } from "../ProgressBar";
import styles from "./styles.module.css";

type Course = {
  title: string;
  cover: string;
  platform: string;
  lessonsDone: number;
  lessonsTotal: number;
  goal: string;
  certificate: boolean;
  modules: { title: string; completed: number; total: number }[];
};

const courses: Course[] = [
  {
    title: "Interface Design",
    cover:
      "https://images.unsplash.com/photo-1542641633-cec279921f6b?auto=format&fit=crop&w=800&q=80",
    platform: "Online course · 12 hours of video",
    lessonsDone: 24,
    lessonsTotal: 40,
    goal: "Nov 30",
    certificate: true,
    modules: [
      { title: "Fundamentals", completed: 8, total: 8 },
      { title: "Typography", completed: 10, total: 10 },
      { title: "Layout", completed: 6, total: 12 },
      { title: "Componentes", completed: 0, total: 6 },
      { title: "Final project", completed: 0, total: 4 },
    ],
  },
  {
    title: "React from Scratch",
    cover:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
    platform: "Online course · 8 hours of video",
    lessonsDone: 5,
    lessonsTotal: 20,
    goal: "No deadline",
    certificate: false,
    modules: [
      { title: "Introduction", completed: 5, total: 5 },
      { title: "Componentes", completed: 0, total: 8 },
      { title: "State and events", completed: 0, total: 7 },
    ],
  },
  {
    title: "Statistics with Python",
    cover:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    platform: "Online course · 10 hours of video",
    lessonsDone: 16,
    lessonsTotal: 20,
    goal: "Oct 25",
    certificate: true,
    modules: [
      { title: "Descriptive statistics", completed: 8, total: 8 },
      { title: "Probability", completed: 8, total: 12 },
    ],
  },
];

export function Courses() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(courses[0]);

  async function handleSalvarCurso(_dados: unknown) {
    setIsModalOpen(false);
  }

  const progressoSelecionado = Math.round(
    (selectedCourse.lessonsDone / selectedCourse.lessonsTotal) * 100,
  );

  return (
    <>
      <main className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1>Courses</h1>
            <p>3 in progress · 5 completed · 64 hours studied</p>
          </div>
          <div className={styles.headerActions}>
            <label className={styles.searchBox}>
              <Search aria-hidden="true" />
              <input type="search" placeholder="Search your library" />
            </label>
            <DefaultButton
              size="sm"
              icon={<Plus aria-hidden="true" />}
              onClick={() => setIsModalOpen(true)}
            >
              Add course
            </DefaultButton>
          </div>
        </header>

        <Card className={styles.tabsCard}>
          <nav className={styles.tabs} aria-label="Filter courses">
            <button type="button" className={styles.activeTab}>
              In progress (3)
            </button>
            <button type="button">Completed (5)</button>
            <button type="button">Queued (4)</button>
          </nav>
        </Card>

        <div className={styles.contentGrid}>
          <Card className={styles.courseList} aria-label="Courses in progress">
            {courses.map((course) => {
              const progress = Math.round(
                (course.lessonsDone / course.lessonsTotal) * 100,
              );
              const selected = course.title === selectedCourse.title;

              return (
                <Card
                  as="article"
                  key={course.title}
                  className={`${styles.courseCard} ${selected ? styles.selectedCourse : ""}`}
                  aria-current={selected ? "true" : undefined}
                >
                  <img
                    className={styles.courseCover}
                    src={course.cover}
                    alt={`${course.title} cover`}
                    loading="lazy"
                  />
                  <div className={styles.courseInfo}>
                    <div className={styles.courseTitleRow}>
                      <h2>{course.title}</h2>
                      <strong>{progress}%</strong>
                    </div>
                    <p>{course.platform}</p>
                    <ProgressBar
                      value={course.lessonsDone}
                      max={course.lessonsTotal}
                      className={styles.progress}
                    />
                    <div className={styles.courseMeta}>
                      <span>
                        Lesson {course.lessonsDone} of {course.lessonsTotal}
                      </span>
                      <span>
                        Goal: {course.goal} · certificate:{" "}
                        {course.certificate ? "yes" : "no"}
                      </span>
                    </div>
                  </div>
                  <div className={styles.courseActions}>
                    <DefaultButton
                      size="sm"
                      onClick={() => setSelectedCourse(course)}
                    >
                      Continue
                    </DefaultButton>
                  </div>
                </Card>
              );
            })}
          </Card>

          <Card className={styles.detailsCard}>
            <span className={styles.detailLabel}>Details</span>
            <h2>{selectedCourse.title}</h2>
            <ProgressBar
              value={selectedCourse.lessonsDone}
              max={selectedCourse.lessonsTotal}
              className={styles.detailProgress}
            />
            <p className={styles.detailProgressText}>
              {selectedCourse.lessonsDone} of {selectedCourse.lessonsTotal}{" "}
              lessons · {progressoSelecionado}%
            </p>
            <div className={styles.modules}>
              {selectedCourse.modules.map((module) => {
                const completed = module.completed === module.total;
                return (
                  <div className={styles.module} key={module.title}>
                    <span
                      className={`${styles.moduleCheck} ${completed ? styles.moduleComplete : ""}`}
                      aria-hidden="true"
                    >
                      {completed ? "✓" : ""}
                    </span>
                    <span>{module.title}</span>
                    <small>
                      {module.completed}/{module.total}
                    </small>
                  </div>
                );
              })}
            </div>
            <label className={styles.notesLabel}>
              Notes
              <textarea placeholder="What I learned today..." />
            </label>
          </Card>
        </div>
      </main>

      <FormModal
        open={isModalOpen}
        title="Add course"
        description="Add a course and track your progress through its lessons."
        onClose={() => setIsModalOpen(false)}
      >
        <CourseForm
          initial={undefined}
          onSubmit={handleSalvarCurso}
          onCancel={() => setIsModalOpen(false)}
        />
      </FormModal>
    </>
  );
}
