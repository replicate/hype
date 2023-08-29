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
  const [sources, setSources] = useState(params.sources ? params.sources.split(",") : ["GitHub", "HuggingFace"]);
  const [lastUpdated, setLastUpdated] = useState("");

  async function handleSourceChange(sources) {
    console.log("sources", sources);

    setSources(sources);
    router.push({ query: { ...router.query, sources: sources.join(",") } }, undefined, {
      shallow: true,
    });

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
    <div className="container mx-auto font-sans">
      <Head>
        {/* Your Head content */}
      </Head>

      <main className="md:px-4">
        <div className="flex justify-between items-center bg-red-600 px-4 py-2 text-md">
          <Link href="/" className="text-white font-bold hover:underline">
            AI News
          </Link>
          <a href="https://github.com/andreasjansson/python-repos#readme" className="text-white ml-4 hover:underline">
            What is this?
          </a>
          <div className="flex items-center ml-auto">
            <Link href="/?filter=past_day" className={`text-white ${currentFilter === "past_day" ? "underline" : ""}`}>
              Past Day
            </Link>
            <span className="text-white mx-4">|</span>
            <Link href="/?filter=past_three_days" className={`text-white ${currentFilter === "past_three_days" ? "underline" : ""}`}>
              Past three days
            </Link>
            <span className="text-white mx-4">|</span>
            <Link href="/?filter=past_week" className={`text-white ${currentFilter === "past_week" || !currentFilter ? "underline" : ""}`}>
              Past week
            </Link>
          </div>
        </div>

        <div className="text-xs flex justify-between items-center bg-table px-4 py-1">
          <SourcePicker onSourceChange={handleSourceChange} selectedSources={sources} />
          <Link href="https://github.com/andreasjansson/python-repos/actions" className="text-gray-500">
            Last updated {lastUpdated}
          </Link>
        </div>

        <ul className="bg-gray-100 relative">
          {repos.map((post, index) => (
            <PostRow key={post.id} post={post} index={index} />
          ))}
        </ul>
      </main>

      <footer className="flex justify-center items-center py-4 border-t-2 border-red-600 md:mx-4">
        <a href="https://replicate.com" className="text-gray-600 text-sm hover:underline">
          Built by Replicate
        </a>
        <span className="md:mx-4">|</span>
        <a href="https://github.com/andreasjansson/python-repos" target="_blank" rel="noopener noreferrer" className="text-gray-600 text-sm hover:underline">
          Fork me on GitHub
        </a>
      </footer>
    </div >
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
