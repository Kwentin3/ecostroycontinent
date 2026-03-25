import Link from "next/link";

import styles from "../components/public/public-ui.module.css";

const homeImages = [
  {
    src: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80",
    alt: "Строительный кран и металлический каркас"
  },
  {
    src: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=80",
    alt: "Рабочие на стройке"
  },
  {
    src: "https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=900&q=80",
    alt: "Городская стройка и леса"
  },
  {
    src: "https://images.unsplash.com/photo-1590496793929-36417f54f4cd?auto=format&fit=crop&w=900&q=80",
    alt: "Строительные материалы и детали работ"
  },
  {
    src: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80",
    alt: "Бетонные и каменные работы"
  },
  {
    src: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=900&q=80",
    alt: "Инженерное и строительное планирование"
  }
];

export default function HomePage() {
  return (
    <main className={styles.homeShell}>
      <header className={styles.homeTopBar}>
        <div>
          <p className={styles.homeEyebrow}>Экостройконтинент</p>
          <h1 className={styles.homeTitle}>Экостройконтинент</h1>
          <p className={styles.homeStatus}>В разработке</p>
        </div>
        <Link href="/admin/login" className={styles.loginIcon} aria-label="Войти в админку" title="Войти в админку">
          ↗
        </Link>
      </header>

      <section className={styles.homeHero}>
        <div className={styles.homeHeroCopy}>
          <p className={styles.homeNote}>
            Временный public shell. Источник картинок: Unsplash. Публичная витрина остаётся read-side only.
          </p>
          <div className={styles.homeFacts}>
            <div className={styles.factCard}>
              <span>Фреймворк</span>
              <strong>Next.js App Router</strong>
            </div>
            <div className={styles.factCard}>
              <span>Статус shell</span>
              <strong>Только read-side</strong>
            </div>
          </div>
        </div>
        <div className={styles.homeMosaic}>
          {homeImages.map((image, index) => (
            <article key={image.src} className={`${styles.mosaicCard} ${index % 3 === 0 ? styles.mosaicWide : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.src} alt={image.alt} loading="lazy" referrerPolicy="no-referrer" />
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
