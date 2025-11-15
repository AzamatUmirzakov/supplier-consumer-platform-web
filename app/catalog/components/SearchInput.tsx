"use client"
import React, { useState } from "react";

const SearchInput = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  return (
    <input value={searchTerm} onChange={handleSearchChange} type="text" name="search" id="search" placeholder="Search items" className="bg-[#1a1a1a] px-3 py-2 rounded-md outline-none w-96" />
  )
}

export default SearchInput;