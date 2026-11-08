import {
  siCloudinary,
  siDocker,
  siExpress,
  siGsap,
  siJsonwebtokens,
  siMongodb,
  siMongoose,
  siNextdotjs,
  siNodedotjs,
  siRabbitmq,
  siReact,
  siRedis,
  siRender,
  siSocketdotio,
  siTailwindcss,
  siTypescript,
  siVercel,
  type SimpleIcon,
} from "simple-icons";
import { PlugsConnected, Queue } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

/* Brand marks from Simple Icons (CC0), keyed by the names used in site.ts */
const brands: Record<string, SimpleIcon> = {
  "Next.js": siNextdotjs,
  React: siReact,
  TypeScript: siTypescript,
  "Tailwind CSS": siTailwindcss,
  GSAP: siGsap,
  "Node.js": siNodedotjs,
  Express: siExpress,
  "Socket.io": siSocketdotio,
  "JWT auth": siJsonwebtokens,
  MongoDB: siMongodb,
  Mongoose: siMongoose,
  Redis: siRedis,
  Cloudinary: siCloudinary,
  Docker: siDocker,
  RabbitMQ: siRabbitmq,
  Render: siRender,
  Vercel: siVercel,
};

/* Ideas rather than products get a plain icon */
const ideas = {
  "REST APIs": PlugsConnected,
  "job queues": Queue,
};

/**
 * A technology's mark, drawn in the current text colour so it sits in the
 * site's ink-and-lamp palette. Decorative: the name always sits beside it.
 * Server only, so the icon data never reaches the browser bundle.
 */
export function TechLogo({ name, className }: { name: string; className?: string }) {
  const brand = brands[name];
  if (brand) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={cn("shrink-0", className)}>
        <path d={brand.path} />
      </svg>
    );
  }
  const Idea = ideas[name as keyof typeof ideas];
  return Idea ? <Idea aria-hidden="true" weight="fill" className={cn("shrink-0", className)} /> : null;
}
