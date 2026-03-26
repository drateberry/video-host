interface CTASectionProps {
  label: string;
  url: string;
}

export function CTASection({ label, url }: CTASectionProps) {
  return (
    <div className="mt-8 text-center">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg rounded-full transition-colors shadow-lg hover:shadow-xl"
      >
        {label}
      </a>
    </div>
  );
}
