import React from "react";

export const PostRow = ({ post, index }) => {
  return (
    <li key={post.id} className="flex py-1 bg-table">
      <span className="w-8 text-right mr-2 text-gray-600">{index + 1}.</span>
      <div className="flex flex-col w-full">
        <div className="flex items-center">
          {" "}
          {/* Removed justify-between */}
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-black text-ssm"
          >
            {post.source === "huggingface" ||
            post.source === "github" ||
            post.source == "replicate"
              ? `${post.username}/${post.name}`
              : post.name}
          </a>
          <span className="text-gray-600 text-xs ml-2">
            {" "}
            {/* Added a bit of padding */}
            {post.source === "huggingface"
              ? "🤗 "
              : post.source === "reddit"
              ? "👽 "
              : post.source === "replicate"
              ? "®️"
              : "⭐ "}
          </span>
          <span className="text-gray-600 text-xs ml-1">{post.stars}</span>
        </div>
        <p className="text-gray-600 text-xs mt-0.5">
          {post.source === "huggingface" ||
          post.source === "github" ||
          post.source == "replicate"
            ? post.description
            : `${post.username} on ${post.description}`}
        </p>
      </div>
    </li>
  );
};
