import { useState, useMemo } from 'react';

export function usePagination<T>(items: T[], itemsPerPage = 10) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const filtered = useMemo(() => 
    items.filter(item => JSON.stringify(item).toLowerCase().includes(search.toLowerCase())),
    [items, search]
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = useMemo(() => 
    filtered.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage),
    [filtered, currentPage, itemsPerPage]
  );
  return { search, setSearch, currentPage, setCurrentPage, totalPages, paginated };
}