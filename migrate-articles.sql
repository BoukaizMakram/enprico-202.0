-- Migrate existing articles from JSON to Supabase
-- Run this AFTER creating the schema

INSERT INTO public.articles (slug, title, title_fr, excerpt, excerpt_fr, content, category, category_fr, author, image_url, read_time, published, published_at) VALUES
(
    '5-tips-improve-english',
    '5 Proven Tips to Improve Your English Speaking Skills',
    '5 Conseils Prouvés pour Améliorer Vos Compétences en Anglais',
    'Discover practical strategies to boost your English speaking confidence and fluency.',
    'Découvrez des stratégies pratiques pour améliorer votre confiance et votre fluidité en anglais.',
    'Full markdown content goes here...',
    'Learning Tips',
    'Conseils d''Apprentissage',
    'Sarah Johnson',
    'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800',
    8,
    true,
    NOW()
),
(
    'ielts-preparation-guide',
    'Complete IELTS Preparation Guide for Beginners',
    'Guide Complet de Préparation IELTS pour Débutants',
    'Everything you need to know to ace your IELTS exam.',
    'Tout ce que vous devez savoir pour réussir votre examen IELTS.',
    'Full markdown content goes here...',
    'Test Preparation',
    'Préparation aux Tests',
    'Michael Chen',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
    12,
    true,
    NOW()
),
(
    'common-english-mistakes',
    '10 Common English Mistakes and How to Avoid Them',
    '10 Erreurs Courantes en Anglais et Comment les Éviter',
    'Learn about the most frequent errors English learners make and how to fix them.',
    'Apprenez les erreurs les plus fréquentes que font les apprenants d''anglais et comment les corriger.',
    'Full markdown content goes here...',
    'Grammar',
    'Grammaire',
    'Emily Rodriguez',
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800',
    10,
    true,
    NOW()
);

-- You'll need to update the 'content' field with actual markdown content
-- See the note below on how to properly migrate markdown files
