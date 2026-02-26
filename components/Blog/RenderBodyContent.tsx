import { Blog } from "@/types/blog";
import { BlockContentRenderer } from "@/components/portable-text/blockContentComponents";

const RenderBodyContent = ({ post }: { post: Blog }) => {
  return (
    <>
      <BlockContentRenderer value={post?.body} />
    </>
  );
};

export default RenderBodyContent;
