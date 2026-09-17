import { create } from 'zustand'

const BASE: string = import.meta.env.VITE_API_BASE_URL ?? ''

export interface ResourceItem {
  id: string
  tenant_id?: string
  created_by?: string
  subject_id?: string | null
  chapter_id?: string | null
  subject_name?: string
  chapter_name?: string
  title: string
  description: string
  resource_type: 'textbook' | 'slides' | 'worksheet' | 'notes' | 'formula_sheet' | 'video' | string
  file_url: string
  meta: Record<string, any>
  assigned_sections: string[]
  status: 'ready' | 'assigned' | 'archived' | string
  created_at: string
  updated_at?: string
}

interface ResourceState {
  resources: ResourceItem[]
  loading: boolean
  error: string | null
  selectedSubjectId: string
  selectedChapterId: string
  selectedType: string
  selectedSection: string
  searchQuery: string
  previewResource: ResourceItem | null
  assigningResource: ResourceItem | null

  fetchResources: () => Promise<void>
  createResource: (payload: Partial<ResourceItem>) => Promise<ResourceItem>
  updateResource: (id: string, payload: Partial<ResourceItem>) => Promise<void>
  deleteResource: (id: string) => Promise<void>
  assignResource: (id: string, sectionNames: string[], action?: 'assign' | 'unassign') => Promise<void>
  
  setSelectedSubjectId: (id: string) => void
  setSelectedChapterId: (id: string) => void
  setSelectedType: (type: string) => void
  setSelectedSection: (section: string) => void
  setSearchQuery: (query: string) => void
  setPreviewResource: (resource: ResourceItem | null) => void
  setAssigningResource: (resource: ResourceItem | null) => void
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('edova_auth_token') || ''
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const useResourceStore = create<ResourceState>((set, get) => ({
  resources: [],
  loading: false,
  error: null,
  selectedSubjectId: 'ALL',
  selectedChapterId: 'ALL',
  selectedType: 'ALL',
  selectedSection: 'ALL',
  searchQuery: '',
  previewResource: null,
  assigningResource: null,

  fetchResources: async () => {
    set({ loading: true, error: null })
    try {
      const { selectedSubjectId, selectedChapterId, selectedType, selectedSection, searchQuery } = get()
      const params = new URLSearchParams()
      if (selectedSubjectId && selectedSubjectId !== 'ALL') params.append('subject_id', selectedSubjectId)
      if (selectedChapterId && selectedChapterId !== 'ALL') params.append('chapter_id', selectedChapterId)
      if (selectedType && selectedType !== 'ALL') params.append('resource_type', selectedType)
      if (selectedSection && selectedSection !== 'ALL') params.append('section_name', selectedSection)
      if (searchQuery.trim()) params.append('search', searchQuery.trim())

      const res = await fetch(`${BASE}/api/resources?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch resources`)
      const data: ResourceItem[] = await res.json()
      set({ resources: data, loading: false })
    } catch (err: any) {
      set({ error: err.message || 'Error fetching resources', loading: false })
    }
  },

  createResource: async (payload) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${BASE}/api/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to create resource`)
      const created: ResourceItem = await res.json()
      await get().fetchResources()
      return created
    } catch (err: any) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  updateResource: async (id, payload) => {
    try {
      const res = await fetch(`${BASE}/api/resources/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to update resource`)
      await get().fetchResources()
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },

  deleteResource: async (id) => {
    try {
      const res = await fetch(`${BASE}/api/resources/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to delete resource`)
      set((state) => ({
        resources: state.resources.filter((r) => r.id !== id),
      }))
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },

  assignResource: async (id, sectionNames, action = 'assign') => {
    try {
      const res = await fetch(`${BASE}/api/resources/${id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ section_names: sectionNames, action }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to assign resource`)
      const data = await res.json()
      set((state) => ({
        resources: state.resources.map((r) =>
          r.id === id
            ? { ...r, assigned_sections: data.assigned_sections, status: data.resource_status }
            : r
        ),
      }))
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },

  setSelectedSubjectId: (id) => {
    set({ selectedSubjectId: id, selectedChapterId: 'ALL' })
    void get().fetchResources()
  },

  setSelectedChapterId: (id) => {
    set({ selectedChapterId: id })
    void get().fetchResources()
  },

  setSelectedType: (type) => {
    set({ selectedType: type })
    void get().fetchResources()
  },

  setSelectedSection: (section) => {
    set({ selectedSection: section })
    void get().fetchResources()
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query })
  },

  setPreviewResource: (resource) => set({ previewResource: resource }),
  setAssigningResource: (resource) => set({ assigningResource: resource }),
}))
