import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getPythonRepos } from '../lib/repos';
import styles from '../styles/Home.module.css';


export default function Home({ filter }) {
  const [repos, setRepos] = useState([]);
  const [currentFilter, setCurrentFilter] = useState(filter);

  useEffect(() => {
    async function loadRepos() {
      const newRepos = await getPythonRepos(currentFilter);
      console.log(currentFilter);
      setRepos(newRepos);
    }
    loadRepos();
  }, [currentFilter]);

  useEffect(() => {
    setCurrentFilter(filter);
    setRepos([]);
  }, [filter]);

  return (
    <div className={styles.container}>
      <div>
        <style jsx global>{`
      body {
        margin: 0px;
        padding: 0px;
      }
    `}</style>
      </div>

      <Head>
        <title>Python GitHub Repositories</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>

        <div className={styles.header}>
          <h1 className={styles.title}>Python Repositories</h1>
          <div className={styles.filterLinks}>
            <Link href="/?filter=past_day">
              <span
                className={`${styles.filterButton} ${currentFilter === 'past_day' ? styles.selectedFilter : ''
                  }`}
              >
                Past Day
              </span>
            </Link>
            <span className={styles.separator}>|</span>
            <Link href="/?filter=past_three_days">
              <span
                className={`${styles.filterButton} ${currentFilter === 'past_three_days' ? styles.selectedFilter : ''
                  }`}
              >
                Past Three Days
              </span>
            </Link>
            <span className={styles.separator}>|</span>
            <Link href="/?filter=past_week">
              <span
                className={`${styles.filterButton} ${currentFilter === 'past_week' ? styles.selectedFilter : ''
                  }`}
              >
                Past Week
              </span>
            </Link>
          </div>
        </div>

        <ul className={styles.list}>
          {repos.map((repo, index) => (
            <li key={repo.id} className={`${styles.listItem} ${index % 2 === 1 ? styles.odd : ''}`}>
              <span className={styles.index}>{index + 1}. </span>
              <div className={styles.repoContent}>
                <div className={styles.repoTitle}>
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.repoLink}
                  >
                    {repo.username}/{repo.name}
                  </a>
                  <span className={styles.stars}>⭐ {repo.stars}</span>
                </div>
                <p className={styles.description}>{repo.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://github.com/andreasjansson/python-repos"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.footerLink}
        >
          Fork me on GitHub
        </a>
      </footer>
    </div>
  );
}

export async function getServerSideProps(context) {
  const filter = context.query.filter || 'past_week';
  return {
    props: {
      filter,
    },
  };
}
