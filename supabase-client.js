/**
 * Supabase Client Configuration
 *
 * This file initializes the Supabase client for use throughout the application.
 * Make sure to set up your .env file with the correct credentials first.
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Supabase configuration
// In production, use environment variables or a build tool like Vite
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || 'https://bzophrxgmwhobbucnvkf.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6b3BocnhnbXdob2JidWNudmtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTk5MjMsImV4cCI6MjA4MTAzNTkyM30.yeT8z4uGHXMrJcMFkqDbOOSjFIO0p6e1HLNIKBoXoKw';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

/**
 * Alternative: If not using a build tool, you can hardcode values here
 * (NOT recommended for production - keys will be visible in source)
 */
/*
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGc...your_key_here';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
*/

/**
 * Helper Functions
 */

// Check if user is authenticated
export async function isAuthenticated() {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
}

// Get current user
export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
}

// Get user profile
export async function getUserProfile(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    return { data, error };
}

// Sign up new user
export async function signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName
            }
        }
    });
    return { data, error };
}

// Sign in user
export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    return { data, error };
}

// Sign out user
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
}

// Get all published articles
export async function getPublishedArticles(language = 'en') {
    const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false });
    return { data, error };
}

// Get article by slug
export async function getArticleBySlug(slug) {
    const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();
    return { data, error };
}

// Get articles by category
export async function getArticlesByCategory(category) {
    const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('category', category)
        .eq('published', true)
        .order('published_at', { ascending: false });
    return { data, error };
}

// Submit contact form
export async function submitContactForm(formData) {
    const { data, error } = await supabase
        .from('contact_submissions')
        .insert([{
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            message: formData.message
        }]);
    return { data, error };
}

// Get all courses
export async function getCourses() {
    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });
    return { data, error };
}

// Get course with lessons
export async function getCourseWithLessons(courseId) {
    const { data, error } = await supabase
        .from('courses')
        .select(`
            *,
            lessons (*)
        `)
        .eq('id', courseId)
        .single();
    return { data, error };
}

// Enroll in course
export async function enrollInCourse(courseId) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
        .from('enrollments')
        .insert([{
            user_id: user.id,
            course_id: courseId
        }]);
    return { data, error };
}

// Get user's enrollments
export async function getUserEnrollments() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
        .from('enrollments')
        .select(`
            *,
            courses (*)
        `)
        .eq('user_id', user.id);
    return { data, error };
}

// Update lesson progress
export async function updateLessonProgress(lessonId, completed = true) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
        .from('lesson_progress')
        .upsert([{
            user_id: user.id,
            lesson_id: lessonId,
            completed,
            completed_at: completed ? new Date().toISOString() : null
        }], {
            onConflict: 'user_id,lesson_id'
        });
    return { data, error };
}

// Upload file to storage
export async function uploadFile(bucket, filePath, file) {
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });
    return { data, error };
}

// Get public URL for file
export function getPublicUrl(bucket, filePath) {
    const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
    return data.publicUrl;
}

/**
 * Real-time subscriptions
 */

// Subscribe to articles changes
export function subscribeToArticles(callback) {
    return supabase
        .channel('articles-changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'articles' },
            callback
        )
        .subscribe();
}

// Unsubscribe from channel
export function unsubscribe(subscription) {
    supabase.removeChannel(subscription);
}

// Listen to auth changes
export function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
}

export default supabase;
