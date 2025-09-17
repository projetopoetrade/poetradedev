import { ClientPerspective } from "next-sanity";

const config = {
	projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID as string,
	dataset: "production",
	apiVersion: "2025-05-21",
	useCdn: false,
	token: process.env.SANITY_API_KEY as string,
	perspective: 'published' as ClientPerspective,
};

export default config;