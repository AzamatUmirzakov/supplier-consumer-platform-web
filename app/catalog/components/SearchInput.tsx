"use client"
import React from "react";
import { useCatalogStore } from "@/lib/catalog-store";

const SearchInput = () => {
  const searchTerm = useCatalogStore((state) => state.searchTerm);
  const setSearchTerm = useCatalogStore((state) => state.setSearchTerm);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <input
      value={searchTerm}
      onChange={handleSearchChange}
      type="text"
      name="search"
      id="search"
      placeholder="Search items"
      className="bg-[#1a1a1a] px-3 py-2 rounded-md outline-none w-96"
    />
  )
}

export default SearchInput;