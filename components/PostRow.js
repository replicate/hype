import React from "react";

export const PostRow = ({ post, index }) => {
  const sourceLabels = {
    huggingface: "HF",
    reddit: "R",
    replicate: "REP",
    github: "GH"
  };

  const sourceColors = {
    huggingface: "text-yellow-700",
    reddit: "text-blue-700",
    replicate: "text-purple-700",
    github: "text-gray-700"
  };

  return (
    <tr className="hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors duration-150">
      <td className="text-right pr-3 py-2 pl-4 align-top text-gray-500 text-sm first:pl-4">
        {index + 1}.
      </td>
      <td className="py-2 pr-4 last:pr-4">
        <div>
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-800 hover:text-orange-600 text-sm"
          >
            {post.source === "huggingface" ||
            post.source === "github" ||
            post.source == "replicate"
              ? `${post.username}/${post.name}`
              : post.name}
          </a>
          <span className="text-gray-500 text-xs ml-2">
            (<span className={`${sourceColors[post.source] || sourceColors.github} font-medium`}>
              {sourceLabels[post.source] || sourceLabels.github}
            </span>)
          </span>
        </div>
        <div className="text-xs text-gray-600 mt-0.5">
          {post.stars} {post.source === "reddit" ? "points" : "stars"}
          {post.description && (
            <>
              <span className="mx-1">•</span>
              <span className="text-gray-700">
                {post.source === "reddit" 
                  ? `by ${post.username} in ${post.description}`
                  : post.description.length > 120 
                    ? post.description.substring(0, 120) + "..."
                    : post.description
                }
              </span>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};
