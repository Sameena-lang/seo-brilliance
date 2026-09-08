import { useState, useEffect } from 'react';
import { useProjects } from './use-api';

export function useActiveProject() {
  const { data: projects = [], isLoading } = useProjects();
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Initialize from localStorage or fallback to first project
  useEffect(() => {
    if (isLoading) return;

    const stored = localStorage.getItem('seo_active_project');
    if (stored && projects.find((p: any) => p.id === stored)) {
      setActiveProjectId(stored);
    } else if (projects.length > 0) {
      setActiveProjectId(projects[0].id);
      localStorage.setItem('seo_active_project', projects[0].id);
    } else {
      setActiveProjectId(null);
    }
  }, [projects, isLoading]);

  const setProject = (id: string) => {
    setActiveProjectId(id);
    localStorage.setItem('seo_active_project', id);
  };

  const activeProject = projects.find((p: any) => p.id === activeProjectId) || projects[0];

  return { activeProjectId, activeProject, setProject, projects, isLoading };
}
