import supabase from "lib/supabase";
import { timeSince } from "lib/utils";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getPythonRepos } from "../lib/repos";
import styles from "../styles/Home.module.css";

export default function Home({ filter }) {
  const router = useRouter();
  const params = router.query;

  const [repos, setRepos] = useState([]);
  const [currentFilter, setCurrentFilter] = useState(params.filter);
  const [currentSource, setCurrentSource] = useState(params.source);
  const [lastUpdated, setLastUpdated] = useState("");

  async function handleSourceChange(source) {
    source = source.toLowerCase();
    setCurrentSource(source);
    router.push({ query: { ...router.query, source: source } }, undefined, {
      shallow: true,
    });

    setRepos([]);
    const newRepos = await getPythonRepos(currentFilter, source);
    setRepos(newRepos);
  }

  useEffect(() => {
    async function loadRepos() {
      const { data: lastUpdated } = await supabase.rpc(
        "repositories_last_modified"
      );
      const date = new Date(lastUpdated);
      setLastUpdated(`${timeSince(date)} ago`);

      const newRepos = await getPythonRepos(currentFilter, currentSource);
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
        <title>Trending Python Repositories</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=0"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.header}>
          <a
            href="https://github.com/andreasjansson/python-repos"
            className={styles.title}
          >
            TrendingPython
          </a>
          <span
            style={{
              fontSize: "1.3rem",
              paddingLeft: "0.5rem",
              color: "white",
            }}
            className={styles.titleBreak}
          >
            |
          </span>
          <a
            className={styles.what}
            href="https://github.com/andreasjansson/python-repos#readme"
          >
            What is this?
          </a>
          <div className={styles.filterLinks}>
            <Link
              href="/?filter=past_day"
              className={`${styles.filterButton} ${currentFilter === "past_day" ? styles.selectedFilter : ""
                }`}
            >
              Past Day
            </Link>
            <span className={styles.separator}>|</span>
            <Link
              href="/?filter=past_three_days"
              className={`${styles.filterButton} ${currentFilter === "past_three_days" ? styles.selectedFilter : ""
                }`}
            >
              Past Three Days
            </Link>
            <span className={styles.separator}>|</span>
            <Link
              href="/?filter=past_week"
              className={`${styles.filterButton} ${currentFilter === "past_week" ? styles.selectedFilter : ""
                }`}
            >
              Past Week
            </Link>
          </div>
          <div
            className={styles.hoverLink}
            style={{
              display: "flex",
              paddingTop: "0.4rem",
              justifyContent: "space-between",
              fontSize: "0.8rem",
              fontWeight: "lighter",
            }}
          ></div>
        </div>
        <ul className={styles.list}>
          {/*write a select dropdown  */}
          <div
            style={{
              textDecoration: "none",
              color: "gray",
              fontSize: "0.8rem",
              position: "absolute",
              right: "0.5rem",
              top: "0.5rem",
            }}
          >
            <select
              style={{ marginRight: "0.5rem" }}
              defaultValue={currentSource}
              onChange={(e) => handleSourceChange(e.target.value)}
            >
              <option value="all">All</option>
              <option value="github">GitHub</option>
              <option value="huggingface">HuggingFace</option>
            </select>
            <Link
              style={{
                textDecoration: "none",
                color: "gray",
              }}
              className={styles.lastUpdated}
              href="https://github.com/andreasjansson/python-repos/actions"
            >
              Last updated {lastUpdated}
            </Link>
          </div>

          {repos.map((repo, index) => (
            <li
              key={repo.id}
              className={`${styles.listItem} ${index % 2 === 1 ? styles.odd : ""
                }`}
            >
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
                  <span className={styles.stars}>
                    {repo.source === "huggingface" ? "🤗 " : "⭐ "}
                    {repo.stars}
                  </span>
                </div>
                <p className={styles.description}>{repo.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </main>

      <footer className={styles.footer}>
        <a className={styles.footerLink} href="https://replicate.com">
          Built by Replicate
        </a>
        <span className={styles.separator}>|</span>
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
  const filter = context.query.filter || "past_week";
  return {
    props: {
      filter,
    },
  };
}
