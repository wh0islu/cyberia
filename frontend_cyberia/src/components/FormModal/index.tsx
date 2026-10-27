import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { X } from "lucide-react";
import styles from "./styles.module.css";

type FormModalProps = {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
};

export function FormModal({
  open,
  title,
  description,
  onClose,
  children,
}: FormModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.modal}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      <div className={styles.modalBox}>
        <header className={styles.modalHeader}>
          <div>
            <h2 id={titleId} className={styles.modalTitle}>
              {title}
            </h2>
            {description && (
              <p className={styles.modalDescription}>{description}</p>
            )}
          </div>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Close form"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </button>
        </header>
        {open && children}
      </div>
    </dialog>
  );
}
