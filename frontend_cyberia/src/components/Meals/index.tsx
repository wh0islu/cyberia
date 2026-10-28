import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { MealForm } from "../../forms";
import { Card } from "../Card";
import { DefaultButton } from "../DefaultButton";
import { FormModal } from "../FormModal";
import styles from "./styles.module.css";

type MealEntry = {
  type: string;
  time: string;
  items: string[];
  tags: string[];
  photo?: string;
};

const meals: MealEntry[] = [
  {
    type: "Breakfast",
    time: "07:15",
    items: ["Tapioca with cheese", "Coffee", "Papaya"],
    tags: ["Homemade", "Quick"],
    photo:
      "https://s2-receitas.glbimg.com/TGFaVyb6Xs1aFnYOI_gBvi3c6-o%3D/0x0%3A1280x800/984x0/smart/filters%3Astrip_icc%28%29/i.s3.glbimg.com/v1/AUTH_1f540e0b94d8437dbbc39d567a1dee68/internal_photos/bs/2022/0/F/3LW7SjRteJnw0h7LDjAw/tapioca-mitos-verdades.jpg",
  },
  {
    type: "Lunch",
    time: "12:40",
    items: ["Rice and beans", "Grilled fish", "Leafy salad"],
    tags: ["Homemade"],
    photo:
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/21/6c/87/c1/panela-de-cumuru.jpg?h=1100&s=1&w=1100",
  },
  { type: "Snack", time: "—", items: [], tags: [] },
  { type: "Dinner", time: "—", items: [], tags: [] },
];

const calendarDays = Array.from({ length: 31 }, (_, index) => index + 1);
const registeredDays = new Set([
  1, 2, 3, 4, 6, 7, 8, 9, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22,
]);

export function Meals() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function handleSalvarRefeicao(_dados: unknown) {
    setIsModalOpen(false);
  }

  return (
    <>
      <main className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1>Meal log</h1>
            <p>Daily meal log, with optional photos</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.datePicker} aria-label="Navigate dates">
              <button type="button" aria-label="Previous day">
                <ChevronLeft />
              </button>
              <span>Today · Oct 22</span>
              <button type="button" aria-label="Next day">
                <ChevronRight />
              </button>
            </div>
            <DefaultButton
              size="sm"
              icon={<Plus aria-hidden="true" />}
              onClick={() => setIsModalOpen(true)}
            >
              Log a meal
            </DefaultButton>
          </div>
        </header>

        <div className={styles.contentGrid}>
          <section className={styles.mealsGrid} aria-label="Today's meals">
            {meals.map((meal) => (
              <Card as="article" className={styles.mealCard} key={meal.type}>
                <header className={styles.mealHeader}>
                  <h2>{meal.type}</h2>
                  <time>{meal.time}</time>
                </header>
                {meal.photo && (
                  <img
                    className={styles.mealPhoto}
                    src={meal.photo}
                    alt={`${meal.type} photo`}
                    loading="lazy"
                  />
                )}
                {meal.items.length > 0 ? (
                  <>
                    <ul className={styles.foodList}>
                      {meal.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <div className={styles.tags}>
                      {meal.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className={styles.emptyMessage}>Nothing logged yet.</p>
                    <DefaultButton
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsModalOpen(true)}
                    >
                      <Plus aria-hidden="true" /> Add
                    </DefaultButton>
                  </>
                )}
              </Card>
            ))}
          </section>

          <aside className={styles.sidebar}>
            <Card className={styles.calendarCard}>
              <header className={styles.calendarHeader}>
                <h2>October</h2>
                <span>18 days logged</span>
              </header>
              <div className={styles.weekdays} aria-hidden="true">
                {["D", "S", "T", "Q", "Q", "S", "S"].map((day, index) => (
                  <span key={`${day}-${index}`}>{day}</span>
                ))}
              </div>
              <div className={styles.calendarDays}>
                {calendarDays.map((day) => (
                  <button
                    type="button"
                    key={day}
                    className={`${registeredDays.has(day) ? styles.dayRegistered : ""} ${day === 22 ? styles.daySelected : ""}`}
                    aria-label={`${day} of October${registeredDays.has(day) ? ", meals logged" : ""}`}
                    aria-pressed={day === 22}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <div className={styles.calendarLegend}>
                <span>
                  <i className={styles.legendRegistered} /> logged
                </span>
                <span>
                  <i /> not logged
                </span>
              </div>
            </Card>

            <Card title="Daily notes" className={styles.notesCard}>
              <textarea
                aria-label="Daily notes"
                placeholder="How I felt, water, extra snacks..."
              />
            </Card>
          </aside>
        </div>
      </main>

      <FormModal
        open={isModalOpen}
        title="Log a meal"
        description="Quick to fill out; a photo is optional."
        onClose={() => setIsModalOpen(false)}
      >
        <MealForm
          initial={undefined}
          onSubmit={handleSalvarRefeicao}
          onCancel={() => setIsModalOpen(false)}
        />
      </FormModal>
    </>
  );
}
