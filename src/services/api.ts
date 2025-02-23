import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ExtractedTask } from '../types/task.types';

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
    credentials: 'include',
  }),
  endpoints: builder => ({
    extractTasks: builder.mutation<ExtractedTask[], { text: string }>({
      query: body => ({
        url: '/tasks/extract',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useExtractTasksMutation } = api;
