export const prerender = true;

export async function getStaticPaths() {
    const mdPostsGlob = import.meta.glob('../../posts/*.md', { eager: true });
    const mdPosts = Object.values(mdPostsGlob);

    // Lấy danh sách các categories duy nhất từ frontmatter của các bài viết
    const categories = new Set();
    mdPosts.forEach((p: any) => {
        if (p.frontmatter.category) {
            categories.add(p.frontmatter.category);
        }
    });

    return Array.from(categories).map(slug => ({
        params: { slug },
        props: { slug }
    }));
}

export async function GET({ params, props }: any) {
    const { slug } = props;

    // Lấy tất cả bài viết markdown
    const mdPostsGlob = import.meta.glob('../../posts/*.md', { eager: true });
    const mdPosts = Object.values(mdPostsGlob);

    // Lọc bài viết theo category slug
    const parsedMdPosts = mdPosts
        .filter((p: any) => p.frontmatter.category === slug)
        .map((p: any) => ({
            title: p.frontmatter.title,
            slug: p.frontmatter.slug || p.file.split('/').pop()?.replace('.md', ''),
            excerpt: p.frontmatter.excerpt,
            published_at: p.frontmatter.published_at,
            image: p.frontmatter.image,
        }));

    // Sắp xếp bài viết mới nhất lên trước
    const allPosts = [...parsedMdPosts].sort((a, b) => {
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });

    return new Response(JSON.stringify(allPosts), {
        status: 200,
        headers: {
            "Content-Type": "application/json"
        }
    });
}
