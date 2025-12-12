/**
 * Article Migration Script
 *
 * This script migrates articles from your local JSON/markdown files to Supabase.
 *
 * Prerequisites:
 * 1. npm install @supabase/supabase-js dotenv
 * 2. Create .env file with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * 3. Run: node migrate-articles-to-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Supabase client with service role key (has admin privileges)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Read articles from local index.json
 */
function readArticlesIndex() {
    try {
        const indexPath = join(__dirname, 'content', 'articles', 'index.json');
        const indexData = readFileSync(indexPath, 'utf-8');
        return JSON.parse(indexData);
    } catch (error) {
        console.error('❌ Error reading index.json:', error.message);
        return [];
    }
}

/**
 * Read markdown content for an article
 */
function readArticleMarkdown(articleId) {
    try {
        const mdPath = join(__dirname, 'content', 'articles', `${articleId}.md`);
        return readFileSync(mdPath, 'utf-8');
    } catch (error) {
        console.error(`❌ Error reading ${articleId}.md:`, error.message);
        return '';
    }
}

/**
 * Transform article data for Supabase
 */
function transformArticle(article) {
    const content = readArticleMarkdown(article.id);

    return {
        slug: article.slug,
        title: article.title,
        title_fr: article.titleFr || null,
        excerpt: article.excerpt,
        excerpt_fr: article.excerptFr || null,
        content: content,
        content_fr: null, // Add French content if available
        category: article.category,
        category_fr: article.categoryFr || null,
        author: article.author,
        image_url: article.image,
        read_time: article.readTime,
        published: true,
        published_at: article.date || new Date().toISOString()
    };
}

/**
 * Migrate all articles to Supabase
 */
async function migrateArticles() {
    console.log('🚀 Starting article migration...\n');

    // Read local articles
    const localArticles = readArticlesIndex();

    if (localArticles.length === 0) {
        console.log('⚠️  No articles found in index.json');
        return;
    }

    console.log(`📚 Found ${localArticles.length} articles to migrate\n`);

    // Transform articles
    const articlesToInsert = localArticles.map(transformArticle);

    // Clear existing articles (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing articles...');
    const { error: deleteError } = await supabase
        .from('articles')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
        console.error('❌ Error clearing articles:', deleteError.message);
    } else {
        console.log('✅ Existing articles cleared\n');
    }

    // Insert articles
    console.log('📝 Inserting articles into Supabase...');

    let successCount = 0;
    let errorCount = 0;

    for (const article of articlesToInsert) {
        const { data, error } = await supabase
            .from('articles')
            .insert([article])
            .select();

        if (error) {
            console.error(`❌ Failed to insert "${article.title}":`, error.message);
            errorCount++;
        } else {
            console.log(`✅ Inserted: ${article.title}`);
            successCount++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📚 Total: ${localArticles.length}`);
    console.log('='.repeat(50) + '\n');

    if (successCount > 0) {
        console.log('🎉 Migration completed successfully!');
        console.log('\n💡 Next steps:');
        console.log('   1. Verify articles in Supabase dashboard');
        console.log('   2. Update your frontend to load from Supabase');
        console.log('   3. Test the article pages');
    }
}

/**
 * Verify database connection
 */
async function verifyConnection() {
    console.log('🔍 Verifying Supabase connection...');

    const { data, error } = await supabase
        .from('articles')
        .select('count')
        .limit(1);

    if (error) {
        console.error('❌ Connection failed:', error.message);
        console.log('\n💡 Make sure:');
        console.log('   1. You ran the supabase-schema.sql');
        console.log('   2. Your SUPABASE_URL is correct');
        console.log('   3. Your SUPABASE_SERVICE_ROLE_KEY is correct\n');
        process.exit(1);
    }

    console.log('✅ Connection successful!\n');
}

/**
 * Main execution
 */
async function main() {
    console.log('\n' + '='.repeat(50));
    console.log('  📦 Enprico Article Migration Tool');
    console.log('='.repeat(50) + '\n');

    await verifyConnection();
    await migrateArticles();

    process.exit(0);
}

// Run migration
main().catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
});
