"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Project {
  id: string;
  name: string;
}

interface ProjectStore {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  getProjectById: (id: string | null) => Project | undefined;
  activeOrderName: string | null;
  setActiveOrderName: (name: string | null) => void;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      setProjects: (projects) => set({ projects }),
      selectedProjectId: null,
      setSelectedProjectId: (id) => set({ selectedProjectId: id }),
      getProjectById: (id) => {
        const state = get();
        return state.projects.find(p => p.id === id);
      },
      activeOrderName: null,
      setActiveOrderName: (name) => set({ activeOrderName: name }),
    }),
    {
      name: "selected-project-storage",
    }
  )
);
