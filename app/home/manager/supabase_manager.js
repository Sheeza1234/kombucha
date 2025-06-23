// SupabaseManager.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qjwnczspgtbqkhrmvfxq.supabase.co';
const SUPABASE_KEY = 'your_public_anon_key_here';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

class SupabaseManager {
  static async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      console.log('❌ Error getting user:', error);
      return null;
    }
    return user;
  }

  static async isUserAuthenticated() {
    const user = await this.getCurrentUser();
    return !!user;
  }

  static async fetchAllSpots() {
    const { data, error } = await supabase.from('kombuspots').select('*');
    if (error) {
      console.error('❌ Error fetching spots:', error);
      throw error;
    }
    return data;
  }

  static async addSpot(spot) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const payload = {
      ...spot,
      user_id: user.id,
      like_count: 0,
    };

    const { error } = await supabase.from('kombuspots').insert(payload);
    if (error) throw error;
  }

  static async likeSpot(spotId) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const likePayload = {
      user_id: user.id,
      spot_id: spotId,
    };

    const { data: existingLikes } = await supabase
      .from('spot_likes')
      .select('*')
      .eq('user_id', user.id)
      .eq('spot_id', spotId);

    if (existingLikes.length > 0) return; // already liked

    const { error: insertError } = await supabase.from('spot_likes').insert(likePayload);
    if (insertError) throw insertError;

    const { data: currentSpot } = await supabase
      .from('kombuspots')
      .select('like_count')
      .eq('id', spotId)
      .single();

    const newCount = (currentSpot?.like_count || 0) + 1;

    await supabase.from('kombuspots').update({ like_count: newCount }).eq('id', spotId);
  }

  static async unlikeSpot(spotId) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    await supabase
      .from('spot_likes')
      .delete()
      .eq('user_id', user.id)
      .eq('spot_id', spotId);

    const { data: currentSpot } = await supabase
      .from('kombuspots')
      .select('like_count')
      .eq('id', spotId)
      .single();

    const newCount = Math.max((currentSpot?.like_count || 1) - 1, 0);

    await supabase.from('kombuspots').update({ like_count: newCount }).eq('id', spotId);
  }

  static async checkIfUserLikedSpot(spotId) {
    const user = await this.getCurrentUser();
    if (!user) return false;

    const { data } = await supabase
      .from('spot_likes')
      .select('*')
      .eq('user_id', user.id)
      .eq('spot_id', spotId);

    return data.length > 0;
  }

  static async uploadImage(uri, fileName) {
    const response = await fetch(uri);
    const blob = await response.blob();

    const path = `${fileName}.jpg`;
    const { error } = await supabase.storage.from('images').upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    });

    if (error) throw error;

    return `${SUPABASE_URL}/storage/v1/object/public/images/${path}`;
  }
}

export default SupabaseManager;