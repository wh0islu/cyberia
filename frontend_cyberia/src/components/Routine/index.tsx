import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { HabitForm } from "../../forms";
import { FormModal } from "../FormModal";
import styles from "./styles.module.css";

type Habito = {
  id: number;
  nome: string;
  meta: string;
  diasAtivos: number[];
  diasConcluidos: boolean[];
};

type NovoHabito = {
  name: string;
  goal: string;
  weekdays: number[];
};

const diasDaSemana = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const habitosIniciais: Habito[] = [
  {
    id: 1,
    nome: "Read 20 pages",
    meta: "reading",
    diasAtivos: [0, 1, 2, 3, 4, 5, 6],
    diasConcluidos: [true, true, true, true, false, false, false],
  },
  {
    id: 2,
    nome: "Exercise",
    meta: "45 min",
    diasAtivos: [0, 2, 4, 6],
    diasConcluidos: [true, false, true, false, false, false, false],
  },
  {
    id: 3,
    nome: "Study a course",
    meta: "1 h",
    diasAtivos: [0, 1, 3, 5],
    diasConcluidos: [true, true, false, true, false, false, false],
  },
  {
    id: 4,
    nome: "Drink 2 L of water",
    meta: "2 L",
    diasAtivos: [0, 1, 2, 3, 4, 5, 6],
    diasConcluidos: [true, true, true, true, false, false, false],
  },
  {
    id: 5,
    nome: "Sleep before 11 PM",
    meta: "sleep",
    diasAtivos: [0, 1, 2, 3, 4, 5, 6],
    diasConcluidos: [false, true, true, false, false, false, false],
  },
];

const agenda = [
  { hora: "06:30", nome: "Wake up", detalhe: "Goal: before 7 AM", status: "Done" },
  { hora: "07:00", nome: "Exercise", detalhe: "45 min", status: "Done" },
  { hora: "09:00", nome: "Work / study", detalhe: "4 hours", status: "Done" },
  { hora: "13:00", nome: "Lunch", detalhe: "1 hour", status: "Done" },
  { hora: "19:00", nome: "Study a course", detalhe: "1 hour · Interface Design", status: "Now" },
  { hora: "22:00", nome: "Reading", detalhe: "30 min · Dom Casmurro", status: "Later" },
];

function obterInicioDaSemana(data: Date) {
  const inicio = new Date(data);
  inicio.setHours(0, 0, 0, 0);
  const diasDesdeSegunda = (inicio.getDay() + 6) % 7;
  inicio.setDate(inicio.getDate() - diasDesdeSegunda);
  return inicio;
}

function formatarData(data: Date, opcoes: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", opcoes).format(data);
}

export function Routine() {
  const [modalAberto, setModalAberto] = useState(false);
  const [habitos, setHabitos] = useState(habitosIniciais);
  const [deslocamentoSemana, setDeslocamentoSemana] = useState(0);
  const hoje = new Date();
  const inicioDaSemana = obterInicioDaSemana(hoje);
  inicioDaSemana.setDate(inicioDaSemana.getDate() + deslocamentoSemana * 7);

  const datasDaSemana = diasDaSemana.map((_, indice) => {
    const data = new Date(inicioDaSemana);
    data.setDate(inicioDaSemana.getDate() + indice);
    return data;
  });

  const totalConcluido = habitos.reduce(
    (total, habito) => total + habito.diasConcluidos.filter(Boolean).length,
    0,
  );
  const totalPrevisto = habitos.reduce(
    (total, habito) => total + habito.diasAtivos.length,
    0,
  );
  const porcentagemConcluida = totalPrevisto
    ? Math.round((totalConcluido / totalPrevisto) * 100)
    : 0;

  function alternarConclusao(idHabito: number, indiceDia: number) {
    setHabitos((habitosAtuais) =>
      habitosAtuais.map((habito) =>
        habito.id === idHabito
          ? {
              ...habito,
              diasConcluidos: habito.diasConcluidos.map((concluido, indice) =>
                indice === indiceDia ? !concluido : concluido,
              ),
            }
          : habito,
      ),
    );
  }

  async function handleCriarHabito(dados: NovoHabito) {
    setHabitos((habitosAtuais) => [
      ...habitosAtuais,
      {
        id: Date.now(),
        nome: dados.name,
        meta: dados.goal || "—",
        diasAtivos: dados.weekdays,
        diasConcluidos: Array(7).fill(false),
      },
    ]);
    setModalAberto(false);
  }

  return (
    <>
      <main className={styles.page}>
        <header className={styles.pageHeader}>
          <div>
            <span className={styles.breadcrumb}>Library / Routine</span>
            <h1>Routine</h1>
            <p>Weekly habits and daily schedule</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.weekControls} aria-label="Navigate weeks">
              <button
                type="button"
                aria-label="Previous week"
                onClick={() => setDeslocamentoSemana((valor) => valor - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              <span>
                {formatarData(datasDaSemana[0], { day: "numeric" })} – {formatarData(datasDaSemana[6], { day: "numeric", month: "short" })}
              </span>
              <button
                type="button"
                aria-label="Next week"
                onClick={() => setDeslocamentoSemana((valor) => valor + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <button
              className={styles.primaryButton}
              type="button"
              onClick={() => setModalAberto(true)}
            >
              <Plus size={16} aria-hidden="true" />
              New habit
            </button>
          </div>
        </header>

        <div className={styles.columns}>
          <section className={styles.weekPanel}>
            <header className={styles.panelHeader}>
              <h2>Weekly habits</h2>
              <span>{porcentagemConcluida}% complete</span>
            </header>

            <div className={styles.weekGrid}>
              <div className={styles.gridCorner} />
              {datasDaSemana.map((data, indice) => (
                <div className={styles.dayHeading} key={data.toISOString()}>
                  <span>{diasDaSemana[indice]}</span>
                  <time dateTime={data.toISOString()}>
                    {formatarData(data, { day: "numeric" })}
                  </time>
                </div>
              ))}
              <span className={styles.totalHeading}>Total</span>

              {habitos.map((habito) => (
                <div className={styles.habitRow} key={habito.id}>
                  <span className={styles.habitName}>{habito.nome}</span>
                  {datasDaSemana.map((data, indice) => {
                    const diaAtivo = habito.diasAtivos.includes(indice);
                    const concluido = habito.diasConcluidos[indice];

                    return (
                      <button
                        className={
                          concluido
                            ? styles.dayDone
                            : diaAtivo
                              ? styles.dayScheduled
                              : styles.dayEmpty
                        }
                        type="button"
                        key={`${habito.id}-${data.toISOString()}`}
                        aria-label={`${habito.nome}, ${formatarData(data, { weekday: "long", day: "numeric" })}${concluido ? ", completed" : ", not completed"}`}
                        aria-pressed={concluido}
                        disabled={!diaAtivo}
                        onClick={() => alternarConclusao(habito.id, indice)}
                      >
                        {concluido ? "✓" : ""}
                      </button>
                    );
                  })}
                  <span className={styles.habitTotal}>
                    {habito.diasConcluidos.filter(Boolean).length}/{habito.diasAtivos.length}
                  </span>
                </div>
              ))}
            </div>

            <p className={styles.weekHint}>
              Click a day to mark or unmark it. Longest streak: 12 days (reading)
            </p>
          </section>

          <section className={styles.todayPanel}>
            <header className={styles.todayHeader}>
              <div>
                <h2>Today</h2>
                <p>{formatarData(hoje, { weekday: "long", day: "numeric", month: "short" })}</p>
              </div>
            </header>

            <div className={styles.agendaList}>
              {agenda.map((bloco) => (
                <article className={styles.agendaItem} key={bloco.hora}>
                  <time>{bloco.hora}</time>
                  <div className={styles.agendaDetails}>
                    <div>
                      <h3>{bloco.nome}</h3>
                      <p>{bloco.detalhe}</p>
                    </div>
                    <span className={styles[`status${bloco.status}`]}>
                      {bloco.status}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>

      <FormModal
        open={modalAberto}
        title="New habit"
        description="It will appear in the weekly tracker and today's schedule."
        onClose={() => setModalAberto(false)}
      >
        <HabitForm
          initial={undefined}
          onSubmit={handleCriarHabito}
          onCancel={() => setModalAberto(false)}
        />
      </FormModal>
    </>
  );
}
