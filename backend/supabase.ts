import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Types for our fashion data
export interface FashionItem {
  id: number
  gender: string
  master_category: string
  sub_category: string
  article_type: string
  base_colour: string
  season: string
  year: number
  usage: string
  product_display_name: string
  image_url?: string
  image_filename?: string
}

export interface DetailedFashionItem {
  id: number
  price: number
  discounted_price: number
  style_type: string
  product_type_id: number
  article_number: string
  visual_tag: string
  product_display_name: string
  variant_name: string
  myntra_rating: number
  catalog_add_date: number
  brand_name: string
  age_group: string
  gender: string
  base_colour: string
  colour1: string
  colour2: string
  fashion_type: string
  season: string
  year: string
  usage: string
  vat: number
  display_categories: string
  weight: string
  navigation_id: number
  landing_page_url: string
  article_attributes: any
  cross_links: any[]
  cod_enabled: boolean
  style_images: any
  master_category: any
  sub_category: any
  article_type: any
  is_emi_enabled: boolean
  other_flags: any[]
  article_display_attr: any
  product_descriptors: any
  style_options: any[]
  discount_data: any
  image_url?: string
  image_filename?: string
}

// Helper function to upload image to Supabase storage
export async function uploadImage(file: File | Blob, filename: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('fashion-images')
      .upload(`images/${filename}`, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error uploading image:', error)
      return null
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('fashion-images')
      .getPublicUrl(`images/${filename}`)

    return publicUrlData.publicUrl
  } catch (error) {
    console.error('Error uploading image:', error)
    return null
  }
}

// Helper function to insert basic fashion item
export async function insertFashionItem(item: FashionItem) {
  try {
    const { data, error } = await supabase
      .from('fashion_items')
      .insert([item])
      .select()

    if (error) {
      console.error('Error inserting fashion item:', error)
      return null
    }

    return data[0]
  } catch (error) {
    console.error('Error inserting fashion item:', error)
    return null
  }
}

// Helper function to insert detailed fashion item
export async function insertDetailedFashionItem(item: DetailedFashionItem) {
  try {
    const { data, error } = await supabase
      .from('detailed_fashion_items')
      .insert([item])
      .select()

    if (error) {
      console.error('Error inserting detailed fashion item:', error)
      return null
    }

    return data[0]
  } catch (error) {
    console.error('Error inserting detailed fashion item:', error)
    return null
  }
}

// Helper function to get fashion items with pagination
export async function getFashionItems(page: number = 0, limit: number = 20) {
  try {
    const { data, error } = await supabase
      .from('fashion_items')
      .select('*')
      .range(page * limit, (page + 1) * limit - 1)
      .order('id', { ascending: true })

    if (error) {
      console.error('Error fetching fashion items:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching fashion items:', error)
    return null
  }
}

// Helper function to search fashion items
export async function searchFashionItems(query: string, filters?: any) {
  try {
    let queryBuilder = supabase
      .from('fashion_items')
      .select('*')

    // Add search functionality
    if (query) {
      queryBuilder = queryBuilder.or(`product_display_name.ilike.%${query}%,brand_name.ilike.%${query}%,article_type.ilike.%${query}%`)
    }

    // Add filters
    if (filters) {
      if (filters.gender) queryBuilder = queryBuilder.eq('gender', filters.gender)
      if (filters.category) queryBuilder = queryBuilder.eq('master_category', filters.category)
      if (filters.color) queryBuilder = queryBuilder.eq('base_colour', filters.color)
      if (filters.season) queryBuilder = queryBuilder.eq('season', filters.season)
      if (filters.usage) queryBuilder = queryBuilder.eq('usage', filters.usage)
    }

    const { data, error } = await queryBuilder.limit(50)

    if (error) {
      console.error('Error searching fashion items:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error searching fashion items:', error)
    return null
  }
} 