import type { GolfCourseApiCourse } from '../types';

export async function searchGolfCourses(query: string): Promise<GolfCourseApiCourse[]> {
  const response = await fetch(`/api/golf-courses/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error(await readApiError(response));
  const data = await response.json() as { courses?: GolfCourseApiCourse[] };
  return data.courses ?? [];
}

export async function getGolfCourse(courseId: number): Promise<GolfCourseApiCourse> {
  const response = await fetch(`/api/golf-courses/${courseId}`);
  if (!response.ok) throw new Error(await readApiError(response));
  const data = await response.json() as GolfCourseApiCourse | { course?: GolfCourseApiCourse };
  if ('course' in data && data.course) return data.course;
  if (isGolfCourse(data)) return data;
  throw new Error('Course API returned an unexpected course shape');
}

function isGolfCourse(data: unknown): data is GolfCourseApiCourse {
  return Boolean(
    data &&
    typeof data === 'object' &&
    'id' in data &&
    'club_name' in data &&
    'course_name' in data
  );
}

async function readApiError(response: Response): Promise<string> {
  try {
    const data = await response.json() as { error?: string };
    return data.error ?? `Course API request failed with ${response.status}`;
  } catch {
    return `Course API request failed with ${response.status}`;
  }
}
