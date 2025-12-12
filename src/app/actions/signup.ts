'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function createOrganizationAndUser(data: {
  email: string
  password: string
  fullName: string
  orgName: string
}) {
  try {
    const adminClient = createAdminClient()
    const supabase = await createClient()

    // Create organization slug from name
    const slug = data.orgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    console.log('Service role key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.log('Checking for existing org with slug:', slug)

    // Check if slug already exists
    const { data: existingOrg, error: checkError } = await adminClient
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing org:', checkError)
      return { error: `Database error: ${checkError.message}` }
    }

    if (existingOrg) {
      return {
        error: 'An organization with this name already exists. Please choose a different name.'
      }
    }

    // Create organization
    console.log('Creating organization:', { name: data.orgName, slug })
    const { data: org, error: orgError } = await adminClient
      .from('organizations')
      .insert({
        name: data.orgName,
        slug,
      })
      .select()
      .single()

    if (orgError || !org) {
      console.error('Organization creation error:', orgError)
      return { error: orgError?.message || 'Failed to create organization' }
    }

    console.log('Organization created successfully:', org.id)

    // Create user account with organization_id in metadata
    console.log('Creating auth user with email:', data.email)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          organization_id: org.id,
        },
      },
    })

    if (authError) {
      console.error('Auth signup error:', authError)
      // Clean up organization if auth fails
      await adminClient.from('organizations').delete().eq('id', org.id)
      return { error: authError.message }
    }

    if (!authData.user) {
      console.error('No user returned from auth.signUp')
      await adminClient.from('organizations').delete().eq('id', org.id)
      return { error: 'Failed to create user account' }
    }

    console.log('User created successfully:', authData.user.id)

    // Update user's organization_id (fallback)
    console.log('Updating user default_organization_id')
    const { error: updateError } = await adminClient
      .from('users')
      .update({ default_organization_id: org.id })
      .eq('id', authData.user.id)

    if (updateError) {
      console.error('User update error:', updateError)
    }

    // Add user as owner in organization_members
    console.log('Adding user as owner in organization_members')
    const { error: memberError } = await adminClient
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: authData.user.id,
        role: 'owner',
      })

    if (memberError) {
      console.error('Member insert error:', memberError)
      return { error: memberError.message }
    }

    console.log('Signup completed successfully!')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'An unexpected error occurred' }
  }
}

export async function joinOrganization(data: {
  email: string
  password: string
  fullName: string
  joinCode: string
}) {
  const adminClient = createAdminClient()
  const supabase = await createClient()

  try {
    // Find organization by slug
    const { data: org, error: orgError } = await adminClient
      .from('organizations')
      .select('*')
      .eq('slug', data.joinCode.toLowerCase())
      .single()

    if (orgError || !org) {
      return { error: 'Invalid organization code. Please check and try again.' }
    }

    // Create user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          organization_id: org.id,
        },
      },
    })

    if (authError) {
      return { error: authError.message }
    }

    if (!authData.user) {
      return { error: 'Failed to create user account' }
    }

    // Update user's organization_id
    const { error: updateError } = await adminClient
      .from('users')
      .update({ default_organization_id: org.id })
      .eq('id', authData.user.id)

    if (updateError) {
      console.error('User update error:', updateError)
    }

    // Add user as member
    const { error: memberError } = await adminClient
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: authData.user.id,
        role: 'member',
      })

    if (memberError) {
      return { error: memberError.message }
    }

    return { success: true, orgName: org.name }
  } catch (error: any) {
    return { error: error.message || 'An unexpected error occurred' }
  }
}
