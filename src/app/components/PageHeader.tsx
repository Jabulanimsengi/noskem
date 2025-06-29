'use client';

interface PageHeaderProps {
  title: string;
  description?: string; // Made description optional
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
      {description && (
        <p className="mt-2 text-lg text-gray-600">{description}</p>
      )}
    </div>
  );
}