"use client"

import React from "react"

export interface TechIconMeta {
  id: string
  name: string
  category: "compute" | "database" | "messaging" | "storage" | "cloud" | "security"
  keywords: string[]
  svg: React.FC<{ className?: string; size?: number }>
}

export const TECH_ICONS: Record<string, TechIconMeta> = {
  // --- CLOUD PROVIDERS ---
  aws: {
    id: "aws",
    name: "AWS",
    category: "cloud",
    keywords: ["amazon", "cloud", "aws"],
    svg: ({ className = "h-5 w-5", size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <path d="M11.5 18.5c-2.3 0-4.2-1.2-4.2-3.4 0-2.3 1.8-3.4 4.5-3.4 1.2 0 2.4.2 3.3.6v-1.1c0-1.4-.9-2.2-2.8-2.2-1.3 0-2.6.4-3.5 1.1l-.8-1.5c1.2-.9 2.8-1.4 4.7-1.4 3 0 4.6 1.4 4.6 3.9v6.9h-1.9v-1.2c-.9.9-2.3 1.7-3.9 1.7zm.4-1.7c1.4 0 2.6-.7 3.2-1.7v-1.3c-.8-.4-1.9-.6-3-.6-1.7 0-2.8.7-2.8 1.9 0 1.1.9 1.7 2.6 1.7z" fill="#FF9900" />
        <path d="M25.6 23.2C20.9 26.2 13.9 27 7.7 24.3c-.9-.4-1.5-.9-1.5-1.4 0-.7.8-.9 1.6-.9.2 0 .5.1.8.2 5.5 2.3 11.9 1.7 16.1-.9.7-.4 1.3-.2 1.3.4 0 .3-.2.5-.4.5z" fill="#FF9900" />
        <path d="M26.7 21.6c.4-.7 1.7-.9 2.6-.9.4 0 .8.1 1 .2.3.2.3.6 0 .8-.9.7-2.3 1.4-3.5 1.4-.6 0-.8-.4-.6-.8.1-.3.3-.5.5-.7z" fill="#FF9900" />
      </svg>
    ),
  },

  gcp: {
    id: "gcp",
    name: "Google Cloud",
    category: "cloud",
    keywords: ["gcp", "google", "cloud"],
    svg: ({ className = "h-5 w-5", size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <path d="M20.2 11.5l-3.3-5.8c-.4-.7-1.1-1.2-2-1.2s-1.6.5-2 1.2l-3.3 5.8 4.2 2.4 2.1-1.2 2.1 1.2 2.2-2.4z" fill="#EA4335" />
        <path d="M27.2 22.3l-3.3-5.8-4.2 2.4v4.8h4.2l3.3-1.4z" fill="#4285F4" />
        <path d="M12.9 23.7H6.3l3.3-5.8 4.2 2.4-2.1 3.4h1.2z" fill="#FBBC05" />
        <path d="M16 26.5c3.6 0 6.5-2.9 6.5-6.5s-2.9-6.5-6.5-6.5-6.5 2.9-6.5 6.5 2.9 6.5 6.5 6.5z" fill="#34A853" />
      </svg>
    ),
  },

  azure: {
    id: "azure",
    name: "Microsoft Azure",
    category: "cloud",
    keywords: ["azure", "microsoft", "cloud"],
    svg: ({ className = "h-5 w-5", size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <path d="M18.8 4.8l-8.5 15.6h5.8l2.7-15.6z" fill="#0078D4" />
        <path d="M10.3 20.4l-5.8 6.8h17.9l-12.1-6.8z" fill="#002E5F" />
        <path d="M20.4 12.3l-4.3 7.8 6.3 7.1h5.3l-7.3-14.9z" fill="#50E6FF" />
      </svg>
    ),
  },

  cloudflare: {
    id: "cloudflare",
    name: "Cloudflare",
    category: "cloud",
    keywords: ["cloudflare", "cdn", "workers", "dns"],
    svg: ({ className = "h-5 w-5", size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <path d="M22.8 14.5c-.5-3.2-3.3-5.5-6.5-5.5-2.7 0-5.1 1.6-6.1 4.1-2.4.3-4.2 2.3-4.2 4.9 0 2.8 2.2 5 5 5h11.8c2.8 0 5-2.2 5-5 0-1.8-1-3.4-2.5-4.2-.5-.3-1.4-.8-2.5-.8z" fill="#F38020" />
        <path d="M24 16.5c0-.3 0-.7-.1-1-.4 2.2-2.3 3.8-4.6 3.8h-7.6c-.2 0-.4-.1-.5-.3l-.4-.8c-.1-.2-.1-.4 0-.6l.5-1c.2-.4.7-.6 1.1-.6h6.9c1.6 0 3-1.1 3.4-2.6 1.3.5 2.3 1.8 2.3 3.1z" fill="#FAAE40" />
      </svg>
    ),
  },

  // --- COMPUTE & SERVERLESS ---
  lambda: {
    id: "lambda",
    name: "AWS Lambda",
    category: "compute",
    keywords: ["lambda", "serverless", "function", "aws"],
    svg: ({ className = "h-5 w-5", size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <rect width="32" height="32" rx="8" fill="#FF9900" fillOpacity="0.15" />
        <path d="M8 24l5.5-14h3.5L11.5 24H8zm6.5 0l4.5-8.5 3.5 8.5h4L20 12.5 23 6h-3.5l-3.5 7.5L12 6H8.5l4 9-5.5 9h7.5z" fill="#FF9900" />
      </svg>
    ),
  },

  docker: {
    id: "docker",
    name: "Docker",
    category: "compute",
    keywords: ["docker", "container", "microservice"],
    svg: ({ className = "h-5 w-5", size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <path d="M28.4 15.2c-.4-.3-1.4-.4-2.1-.2-.3-.8-.9-1.5-1.7-1.8-.1 0-.3-.1-.4-.1-.1-.7-.6-1.4-1.2-1.8l-.8-.5-.5.8c-.6 1-.7 2.2-.2 3.3-1.3.8-3.1.9-4.8.9H3.6c-.4 1.5-.1 4.5 1.5 6.4 1.8 2.1 4.4 3.2 8.3 3.2 6.6 0 11.8-3.3 13.9-9.1.5-.1 1.2-.3 1.6-.7.4-.4.6-.9.6-1.2 0-.2-.5-.3-1.1-.2z" fill="#2496ED" />
        <rect x="7" y="14" width="2.5" height="2" rx=".3" fill="#2496ED" />
        <rect x="10.5" y="14" width="2.5" height="2" rx=".3" fill="#2496ED" />
        <rect x="14" y="14" width="2.5" height="2" rx=".3" fill="#2496ED" />
        <rect x="10.5" y="11" width="2.5" height="2" rx=".3" fill="#2496ED" />
        <rect x="14" y="11" width="2.5" height="2" rx=".3" fill="#2496ED" />
        <rect x="17.5" y="14" width="2.5" height="2" rx=".3" fill="#2496ED" />
        <rect x="14" y="8" width="2.5" height="2" rx=".3" fill="#2496ED" />
      </svg>
    ),
  },

  kubernetes: {
    id: "kubernetes",
    name: "Kubernetes",
    category: "compute",
    keywords: ["kubernetes", "k8s", "cluster", "pods"],
    svg: ({ className = "h-5 w-5", size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <path d="M16 4l10.4 6v12L16 28 5.6 22V10L16 4z" stroke="#326CE5" strokeWidth="2" />
        <circle cx="16" cy="16" r="3.5" fill="#326CE5" />
        <path d="M16 8v4.5M16 19.5V24M9.5 12l4 2.5M18.5 17.5l4 2.5M22.5 12l-4 2.5M13.5 17.5l-4 2.5" stroke="#326CE5" strokeWidth="1.5" />
      </svg>
    ),
  },

  nextjs: {
    id: "nextjs",
    name: "Next.js",
    category: "compute",
    keywords: ["nextjs", "react", "frontend", "ssr"],
    svg: ({ className = "h-5 w-5", size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <circle cx="16" cy="16" r="14" fill="#000" stroke="#EDEDED" strokeWidth="1.5" />
        <path d="M12 10v12h2.5V14.5l7 8.5h2V10h-2.5v7.5l-7-8.5H12z" fill="#FFF" />
      </svg>
    ),
  },

  nodejs: {
    id: "nodejs",
    name: "Node.js",
    category: "compute",
    keywords: ["nodejs", "javascript", "backend", "express"],
    svg: ({ className = "h-5 w-5", size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <path d="M16 4l10.4 6v12L16 28 5.6 22V10L16 4z" fill="#339933" fillOpacity="0.2" stroke="#5FA04E" strokeWidth="1.5" />
        <path d="M16 11v10M11 14l5 3 5-3" stroke="#5FA04E" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },

  python: {
    id: "python",
    name: "Python / FastAPI",
    category: "compute",
    keywords: ["python", "fastapi", "django", "ai"],
    svg: ({ className = "h-5 w-5", size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <path d="M15.8 5c-4.5 0-4.2 1.9-4.2 1.9l.01 2h4.3v.6H9.7S6 9.1 6 13.6c0 4.5 3.3 4.3 3.3 4.3h2v-2.8c0-3.2 2.8-3 2.8-3h4.3c2.4 0 2.8-1.7 2.8-2.8V6.8s.5-1.8-5.4-1.8zm-2.4 1.4c.5 0 .9.4.9.9s-.4.9-.9.9-.9-.4-.9-.9.4-.9.9-.9z" fill="#3776AB" />
        <path d="M16.2 27c4.5 0 4.2-1.9 4.2-1.9l-.01-2h-4.3v-.6h6.2s3.7.4 3.7-4.1c0-4.5-3.3-4.3-3.3-4.3h-2v2.8c0 3.2-2.8 3-2.8 3h-4.3c-2.4 0-2.8 1.7-2.8 2.8v2.3s-.5 1.8 5.4 1.8zm2.4-1.4c-.5 0-.9-.4-.9-.9s.4-.9.9-.9.9.4.9.9-.4.9-.9.9z" fill="#FFD43B" />
      </svg>
    ),
  },

  // --- DATABASES & CACHING ---
  postgresql: {
    id: "postgresql",
    name: "PostgreSQL",
    category: "database",
    keywords: ["postgres", "postgresql", "sql", "relational", "database"],
    svg: ({ className = "h-5 w-5", size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <path d="M16 5c-5.5 0-9.8 4-9.8 9.5 0 3.8 2.2 7.2 5.5 8.7v3.8h4.4v-3.5c1.4.3 2.8.3 4.2 0v3.5h4.4v-3.8c3.3-1.5 5.5-4.9 5.5-8.7C30.2 9 21.5 5 16 5z" fill="#4169E1" fillOpacity="0.2" stroke="#336791" strokeWidth="1.5" />
        <circle cx="12" cy="13" r="1.5" fill="#336791" />
        <circle cx="20" cy="13" r="1.5" fill="#336791" />
        <path d="M14 18c1 1 3 1 4 0" stroke="#336791" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },

  redis: {
    id: "redis",
    name: "Redis",
    category: "database",
    keywords: ["redis", "cache", "in-memory", "key-value"],
    svg: ({ className = "h-5 w-5", size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <path d="M16 6l11 5.5-11 5.5-11-5.5L16 6z" fill="#DC382D" />
        <path d="M5 13.5l11 5.5 11-5.5v4l-11 5.5-11-5.5v-4z" fill="#A41E11" />
        <path d="M5 19.5l11 5.5 11-5.5v4l-11 5.5-11-5.5v-4z" fill="#781005" />
      </svg>
    ),
  },

  mongodb: {
    id: "mongodb",
    name: "MongoDB",
    category: "database",
    keywords: ["mongo", "mongodb", "nosql", "document"],
    svg: ({ className = "h-5 w-5", size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <path d="M16 4C16 4 9 10 9 17.5c0 5 3.5 9.5 7 11.5 3.5-2 7-6.5 7-11.5C23 10 16 4 16 4z" fill="#47A248" fillOpacity="0.2" stroke="#47A248" strokeWidth="1.5" />
        <path d="M16 4v25" stroke="#47A248" strokeWidth="1.5" />
      </svg>
    ),
  },

  dynamodb: {
    id: "dynamodb",
    name: "DynamoDB",
    category: "database",
    keywords: ["dynamodb", "dynamo", "nosql", "aws"],
    svg: ({ className = "h-5 w-5", size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <rect width="32" height="32" rx="8" fill="#4053D6" fillOpacity="0.15" />
        <ellipse cx="16" cy="10" rx="9" ry="3.5" stroke="#4053D6" strokeWidth="1.5" />
        <path d="M7 10v6c0 2 4 3.5 9 3.5s9-1.5 9-3.5v-6" stroke="#4053D6" strokeWidth="1.5" />
        <path d="M7 16v6c0 2 4 3.5 9 3.5s9-1.5 9-3.5v-6" stroke="#4053D6" strokeWidth="1.5" />
      </svg>
    ),
  },

  supabase: {
    id: "supabase",
    name: "Supabase",
    category: "database",
    keywords: ["supabase", "postgres", "auth", "backend"],
    svg: ({ className = "h-5 w-5", size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <path d="M17.5 4L6.5 17.5h8.5l-2.5 10.5 13-15h-9l3.5-9z" fill="#3ECF8E" />
      </svg>
    ),
  },

  // --- MESSAGING & STREAMING ---
  kafka: {
    id: "kafka",
    name: "Apache Kafka",
    category: "messaging",
    keywords: ["kafka", "stream", "event", "queue", "pubsub"],
    svg: ({ className = "h-5 w-5", size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <circle cx="9" cy="16" r="3.5" stroke="#E0E0E0" strokeWidth="1.5" fill="#231F20" />
        <circle cx="23" cy="9" r="3.5" stroke="#E0E0E0" strokeWidth="1.5" fill="#231F20" />
        <circle cx="23" cy="23" r="3.5" stroke="#E0E0E0" strokeWidth="1.5" fill="#231F20" />
        <path d="M12.5 14.5l7-3.5M12.5 17.5l7 3.5" stroke="#E0E0E0" strokeWidth="1.5" />
      </svg>
    ),
  },

  rabbitmq: {
    id: "rabbitmq",
    name: "RabbitMQ",
    category: "messaging",
    keywords: ["rabbitmq", "amqp", "queue", "broker"],
    svg: ({ className = "h-5 w-5", size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <rect width="32" height="32" rx="8" fill="#FF6600" fillOpacity="0.15" />
        <path d="M22 17c0-2.5-1.5-4-3.5-4h-2.5c-.5-1.5-1.8-3-3.5-4.5-1-1-2.5-1.5-2.5 0 0 1.5 1.5 3.5 2.5 4.5H10c-2 0-3.5 1.5-3.5 4 0 2 1.5 3.5 3.5 3.5h9c2 0 3-.5 3-3.5z" stroke="#FF6600" strokeWidth="1.5" fill="none" />
      </svg>
    ),
  },

  // --- STORAGE & INGRESS ---
  s3: {
    id: "s3",
    name: "AWS S3 Bucket",
    category: "storage",
    keywords: ["s3", "storage", "bucket", "object", "blob", "aws"],
    svg: ({ className = "h-5 w-5", size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <rect width="32" height="32" rx="8" fill="#E05243" fillOpacity="0.15" />
        <path d="M7 10l9-4 9 4v12l-9 4-9-4V10z" stroke="#E05243" strokeWidth="1.5" fill="none" />
        <path d="M7 10l9 4 9-4M16 14v12" stroke="#E05243" strokeWidth="1.5" />
      </svg>
    ),
  },

  apigateway: {
    id: "apigateway",
    name: "API Gateway",
    category: "storage",
    keywords: ["gateway", "api", "ingress", "proxy", "routing"],
    svg: ({ className = "h-5 w-5", size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <rect width="32" height="32" rx="8" fill="#FF4F8B" fillOpacity="0.15" />
        <path d="M10 8h12v4H10V8zm-3 8h18v4H7v-4zm-3 8h24v4H4v-4z" fill="#FF4F8B" />
      </svg>
    ),
  },

  graphql: {
    id: "graphql",
    name: "GraphQL",
    category: "storage",
    keywords: ["graphql", "api", "query", "schema"],
    svg: ({ className = "h-5 w-5", size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <polygon points="16,5 26,11 26,21 16,27 6,21 6,11" stroke="#E10098" strokeWidth="1.5" fill="none" />
        <polygon points="16,9 23,21 9,21" stroke="#E10098" strokeWidth="1.5" fill="none" />
        <circle cx="16" cy="5" r="2" fill="#E10098" />
        <circle cx="26" cy="11" r="2" fill="#E10098" />
        <circle cx="26" cy="21" r="2" fill="#E10098" />
        <circle cx="16" cy="27" r="2" fill="#E10098" />
        <circle cx="6" cy="21" r="2" fill="#E10098" />
        <circle cx="6" cy="11" r="2" fill="#E10098" />
      </svg>
    ),
  },

  nginx: {
    id: "nginx",
    name: "NGINX",
    category: "storage",
    keywords: ["nginx", "proxy", "reverse-proxy", "load-balancer"],
    svg: ({ className = "h-5 w-5", size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <path d="M16 4l11 6.5v11L16 28 5 21.5v-11L16 4z" fill="#009639" fillOpacity="0.2" stroke="#009639" strokeWidth="1.5" />
        <path d="M11 20V12l10 8V12" stroke="#009639" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },

  // --- SECURITY & MONITORING ---
  auth0: {
    id: "auth0",
    name: "Auth0 / IAM",
    category: "security",
    keywords: ["auth", "auth0", "iam", "jwt", "oauth", "security"],
    svg: ({ className = "h-5 w-5", size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <path d="M16 5l10 4v7c0 6.5-4.5 11.5-10 13-5.5-1.5-10-6.5-10-13V9l10-4z" fill="#EB5424" fillOpacity="0.2" stroke="#EB5424" strokeWidth="1.5" />
        <circle cx="16" cy="14" r="2.5" fill="#EB5424" />
        <path d="M12 21c0-2.5 2-4 4-4s4 1.5 4 4" stroke="#EB5424" strokeWidth="1.5" />
      </svg>
    ),
  },

  prometheus: {
    id: "prometheus",
    name: "Prometheus",
    category: "security",
    keywords: ["prometheus", "metrics", "monitoring", "observability"],
    svg: ({ className = "h-5 w-5", size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <circle cx="16" cy="16" r="11" fill="#E6522C" fillOpacity="0.2" stroke="#E6522C" strokeWidth="1.5" />
        <path d="M16 9v9l4 4" stroke="#E6522C" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },

  datadog: {
    id: "datadog",
    name: "Datadog",
    category: "security",
    keywords: ["datadog", "apm", "logs", "metrics", "monitoring"],
    svg: ({ className = "h-5 w-5", size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <rect width="32" height="32" rx="8" fill="#632CA6" fillOpacity="0.15" />
        <path d="M10 22V10h4c3.5 0 5.5 2 5.5 6s-2 6-5.5 6h-4zm3-3h1c2 0 2.5-1.5 2.5-3s-.5-3-2.5-3h-1v6z" fill="#632CA6" />
      </svg>
    ),
  },
}

export const TECH_ICON_CATALOG = Object.values(TECH_ICONS)

export function TechIcon({
  iconId,
  className = "h-5 w-5",
  size = 20,
}: {
  iconId?: string | null
  className?: string
  size?: number
}) {
  if (!iconId) return null
  const item = TECH_ICONS[iconId.toLowerCase()]
  if (!item) return null
  const SvgComponent = item.svg
  return <SvgComponent className={className} size={size} />
}
