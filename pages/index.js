import supabase from "lib/supabase";
import { timeSince } from "lib/utils";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { PostRow } from "../components/PostRow";
import { SourcePicker } from "../components/SourcePicker";
import { getContent } from "../lib/content";

export default function Home({ filter }) {
  const router = useRouter();
  const params = router.query;

  console.log("filter", filter);

  const [repos, setRepos] = useState([]);
  const [currentFilter, setCurrentFilter] = useState(params.filter);
  const [sources, setSources] = useState(
    params.sources
      ? params.sources.split(",")
      : ["GitHub", "HuggingFace", "Reddit", "Replicate"]
  );
  const [lastUpdated, setLastUpdated] = useState("");

  async function handleSourceChange(sources) {
    console.log("sources", sources);

    setSources(sources);
    router.push(
      { query: { ...router.query, sources: sources.join(",") } },
      undefined,
      {
        shallow: true,
      }
    );

    //setRepos([]);
    const newRepos = await getContent(currentFilter, sources);
    setRepos(newRepos);
  }

  useEffect(() => {
    async function loadRepos() {
      const { data: lastUpdated } = await supabase.rpc(
        "repositories_last_modified"
      );
      const date = new Date(lastUpdated);
      setLastUpdated(`${timeSince(date)} ago`);

      const newRepos = await getContent(currentFilter, sources);
      setRepos(newRepos);
    }
    loadRepos();
  }, [currentFilter]);

  useEffect(() => {
    console.log("filter", filter);
    setCurrentFilter(filter);
    //setRepos([]);
  }, [filter]);

  return (
    <div className="container mx-auto font-sans overflow-x-hidden">
      <Head>{/* Your Head content */}</Head>

      <main className="md:px-4">
        <div className="bg-gradient-to-r from-pink-500 via-orange-500 to-yellow-500">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-center py-3">
              <div className="flex items-center space-x-6">
                <Link
                  href="/"
                  className="group"
                >
                  <span 
                    className="text-white font-black text-3xl tracking-tighter transition-transform duration-300 inline-block"
                    style={{
                      textShadow: '2px 2px 0 rgba(0,0,0,0.2), 4px 4px 0 rgba(255,255,255,0.1)',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      letterSpacing: '-0.05em',
                      transform: 'rotate(-6deg)',
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'rotate(0deg)'}
                    onMouseLeave={(e) => e.target.style.transform = 'rotate(-6deg)'}
                  >
                    HYPE
                  </span>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/?filter=past_day"
                  className={`text-sm ${
                    currentFilter === "past_day" 
                      ? "text-white font-semibold" 
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  past day
                </Link>
                <span className="text-white/50">|</span>
                <Link
                  href="/?filter=past_three_days"
                  className={`text-sm ${
                    currentFilter === "past_three_days"
                      ? "text-white font-semibold"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  past 3 days
                </Link>
                <span className="text-white/50">|</span>
                <Link
                  href="/?filter=past_week"
                  className={`text-sm ${
                    (currentFilter === "past_week" || !currentFilter)
                      ? "text-white font-semibold"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  past week
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-b from-gray-100 to-gray-50 border-b-2 border-gray-200">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-center py-3">
              <SourcePicker
                onSourceChange={handleSourceChange}
                selectedSources={sources}
              />
              <Link
                href="https://github.com/andreasjansson/python-repos/actions"
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Updated {lastUpdated}
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white">
          <div className="h-1 bg-gradient-to-b from-gray-100 to-transparent"></div>
          <div className="max-w-6xl mx-auto">
            <table className="w-full">
              <tbody>
                {repos.map((post, index) => (
                  <PostRow key={post.id} post={post} index={index} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="mt-8 py-6 text-center text-xs text-gray-500">
        <a
          href="https://github.com/andreasjansson/python-repos#readme"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-orange-600"
        >
          What is this?
        </a>
        <span className="mx-2">•</span>
        <a
          href="https://replicate.com"
          className="hover:text-orange-600"
        >
          Built by Replicate
        </a>
        <span className="mx-2">•</span>
        <a
          href="https://github.com/andreasjansson/python-repos"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-orange-600"
        >
          GitHub
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
