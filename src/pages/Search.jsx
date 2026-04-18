import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HiMagnifyingGlass } from 'react-icons/hi2';
import { searchDocuments } from '../lib/api';
import DocumentCard from '../components/DocumentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    searchDocuments(query)
      .then((data) => {
        setResults(data.documents || data || []);
      })
      .catch((err) => {
        console.error('Search error:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Search Results</h1>
        {query && (
          <p className="mt-1 text-sm text-slate-500">
            {loading
              ? 'Searching...'
              : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
          </p>
        )}
      </div>

      {!query.trim() ? (
        <EmptyState
          icon={HiMagnifyingGlass}
          title="Search for documents"
          description="Enter a search term in the bar above to find documents."
        />
      ) : loading ? (
        <LoadingSpinner message={`Searching for "${query}"...`} />
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
          {error}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon={HiMagnifyingGlass}
          title="No results found"
          description={`No documents match "${query}". Try a different search term.`}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {results.map((doc) => (
            <DocumentCard key={doc.id} file={doc} />
          ))}
        </div>
      )}
    </div>
  );
}
