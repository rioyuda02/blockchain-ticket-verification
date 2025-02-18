const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_ANON_KEY } = require('../config/config');

// Create the Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export both the client and other functions
module.exports = {
  supabase,  // Export the client directly
  createUserInDatabase: async (first_name, last_name, email, hashedPassword, phone_number = null) => {
    // For the time being, we are using the supabase auth.admin.createUser method to create a user in the database.
    // And are using the id from the auth.admin.createUser method to create a user in the database.
    // Reason is supabase.auth.signInWithPassword method does not return the user data.

    let { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: hashedPassword,
      email_confirm: true,
      user_metadata: {
        first_name: first_name,
        last_name: last_name,
        phone_number: phone_number
      }
    });
    if (authError) throw authError;

    let { data: userData, error: userError } = await supabase.from('users').insert({
      id: authData.user.id,
      first_name: first_name,
      last_name: last_name,
      email: email,
      password: hashedPassword,
      phone_number: phone_number
    }).select().single();

    if (userError) throw userError;
    return userData;
  },
  signinUserInDatabase: async (email, password) => {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).eq('password', password).single();

    if (error) throw error;
    return data;
  },
  findUserByEmail: async (email) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) return null;
    return data;
  },
  getSubscriptionByUserId: async (userId) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, plan, end_date, start_date, provider, billing_period')
      .eq('user_id', userId)
      .single();

    if (error) return null;
    return data;
  },
  checkExistingSubscription: async (userId) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data !== null;
  },
  createSubscriptionForUserId: async (userId, id, plan, endDate, startDate, provider, billingPeriod) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        id: id,
        user_id: userId,
        plan: plan,
        end_date: endDate,
        start_date: startDate,
        provider: provider,
        billing_period: billingPeriod
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  updateSubscriptionForUserId: async (subscriptionId, userId, plan, endDate, startDate, provider, billingPeriod) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ plan, end_date: endDate, start_date: startDate, provider, billing_period: billingPeriod })
      .eq('id', subscriptionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) return null;
    return data;
  },
  deleteSubscriptionForUserId: async (subscriptionId, userId) => {
    // First, check if the subscription exists and belongs to the user
    const { data: existingSubscription, error: checkError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('id', subscriptionId)
      .eq('user_id', userId)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return { error: 'not_found' };
      }
      throw checkError;
    }

    if (!existingSubscription) {
      return { error: 'not_authorized' };
    }

    // If the subscription exists and belongs to the user, delete it
    const { error: deleteError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', subscriptionId)
      .eq('user_id', userId);

    if (deleteError) throw deleteError;
    return { success: true };
  },
  getCatDetailsById: async (userId, catId) => {
    const { data, error } = await supabase
      .from('cats')
      .select('*')
      .eq('id', catId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },
  getCatsByUserId: async (userId) => {
    const { data, error } = await supabase
      .from('cats')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  },
  getCatByUserId: async (userId, catId) => {
    const { data, error } = await supabase
      .from('cats')
      .select('*')
      .eq('user_id', userId)
      .eq('id', catId);
    if (error) throw error;
    return data;
  },
  createCatByUserId: async (userId, catData) => {
    const { data, error } = await supabase.from('cats').insert({ ...catData, user_id: userId }).select().single();
    if (error) throw error;
    return data;
  },
  updateCatRecommendationsByCatId: async (catId, recommendations) => {
    const { food_bowls, treats, playtime } = recommendations;

    const { data, error } = await supabase
      .from('cats')
      .update({ food_bowls, treats, playtime })
      .eq('id', catId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  updateCatById: async (catId, userId, catData) => {
    const { data, error } = await supabase
      .from('cats')
      .update(catData)
      .eq('id', catId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) return null;
    return data;
  },
  deleteCatById: async (catId, userId) => {
    // First, check if the cat exists and belongs to the user
    const { data: existingCat, error: checkError } = await supabase
      .from('cats')
      .select('id')
      .eq('id', catId)
      .eq('user_id', userId)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return { error: 'not_found' };
      }
      throw checkError;
    }

    if (!existingCat) {
      return { error: 'not_authorized' };
    }

    // If the cat exists and belongs to the user, delete it
    const { error: deleteError } = await supabase
      .from('cats')
      .delete()
      .eq('id', catId)
      .eq('user_id', userId);

    if (deleteError) throw deleteError;
    return { success: true };
  },
  getConversationsByUserId: async (userId) => {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
                id,
                started_at,
                messages (
                    content,
                    role,
                    timestamp
                )
            `)
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (error) throw error;
    return data;
  },
  getConversationsByConversationId: async (userId, conversationId) => {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
                id,
                started_at,
                messages (
                    content,
                    role,
                    timestamp
                )
            `)
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },
  createConversation: async (userId, startedAt) => {
    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: userId, started_at: startedAt })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  createMessage: async (conversation_id, user_id, content, role) => {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation_id,
        user_id: user_id,
        content: content,
        role: role,
      })
      .select()
      .single();

    if (error) {
      console.error("Error in createMessage:", error);
      throw error;
    }
    return data;
  },
  getConversationById: async (conversationId) => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) return null;
    return data;
  },
  findUserById: async (userId) => {
    const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);

    if (error) return null;
    return user;
  },
  deleteConversationById: async (conversationId, userId) => {
    const { data: existingConversation, error: checkError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return { error: 'not_found' };
      }
      throw checkError;
    }

    if (!existingConversation) {
      return { error: 'not_authorized' };
    }

    // If the conversation exists and belongs to the user, delete it and its messages
    const { error: deleteMessagesError } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId);

    if (deleteMessagesError) throw deleteMessagesError;

    const { error: deleteConversationError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (deleteConversationError) throw deleteConversationError;
    return { success: true };
  },
  updateConversationById: async (conversationId, userId, started_at) => {
    const { data, error } = await supabase
      .from('conversations')
      .update({ started_at })
      .eq('id', conversationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  uploadPhotoToSupabase: async (catId, photoData) => {
    if (!photoData) {
      throw new Error('Invalid photo data');
    }

    try {
      const fileExt = photoData.originalname.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `cat-photos/${catId}/${fileName}`;

      const buffer = Buffer.from(photoData.buffer);

      const { data, error } = await supabase.storage
        .from('Cats')
        .upload(filePath, buffer, {
          contentType: photoData.mimetype,
          upsert: false
        });

      if (error) {
        throw error;
      }
      const { data: { publicUrl } } = supabase.storage
        .from('Cats')
        .getPublicUrl(filePath);

      return {
        path: filePath,
        url: publicUrl
      };
    } catch (error) {
      throw new Error(`Failed to upload photo: ${error.message}`);
    }
  },
  savePasswordResetToken: async (userId, token, expires) => {
    const { data, error } = await supabase.from("password_reset_tokens").insert({
      user_id: userId,
      token,
      expires,
    });

    if (error) throw error;
    return data;
  },
  findPasswordResetToken: async (token) => {
    const { data, error } = await supabase
      .from("password_reset_tokens")
      .select("user_id, expires")
      .eq("token", token)
      .single();

    if (error) return null;
    return data;
  },
  updateUserPassword: async (userId, hashedPassword) => {
    const { data, error } = await supabase
      .from("users")
      .update({ password: hashedPassword })
      .eq("id", userId);

    if (error) throw error;
    return data;
  },
  deletePasswordResetToken: async (token) => {
    const { error } = await supabase
      .from("password_reset_tokens")
      .delete()
      .eq("token", token);

    if (error) throw error;
    return { success: true };
  },
  signInWithOTP: async (email, options = {}) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: options.shouldCreateUser || false,
        data: options.data || undefined
      }
    });

    return { data, error };
  },
  verifyOTPFromSupabase: async (email, token, type) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type
    });

    return { data, error };
  },
};
