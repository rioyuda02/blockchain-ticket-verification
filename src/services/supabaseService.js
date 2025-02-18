const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  createUserInDatabase,
  findUserByEmail,
  getSubscriptionByUserId,
  checkExistingSubscription,
  createSubscriptionForUserId,
  updateSubscriptionForUserId,
  deleteSubscriptionForUserId,
  getCatsByUserId,
  createCatByUserId,
  updateCatRecommendationsByCatId,
  updateCatById,
  deleteCatById,
  getConversationsByUserId,
  createConversation,
  createMessage,
  getConversationById,
  findUserById,
  deleteConversationById,
  getCatDetailsById,
  getConversationsByConversationId,
  updateConversationById,
  uploadPhotoToSupabase,
  savePasswordResetToken,
  findPasswordResetToken,
  updateUserPassword,
  deletePasswordResetToken,
  resetPasswordForEmail,
  signInWithOTP,
  verifyOTPFromSupabase,
  signinUserInDatabase,
} = require("./supabaseConnection");
const { JWT_SECRET } = require("../config/config");
const openaiService = require('./openaiService');
// const { emailTransfer, getSubscriptionCancelTemplate } = require('../config/email');
// const { getSignUpConfirmationHtmlTemplate, getResetPasswordHtmlTemplate, getSubscriptionSuccessTemplate } = require('../config/email');
// const { createEventInKlaviyo, createUserInKlaviyo } = require("./klaviyoConnection");
const { supabase } = require('./supabaseConnection');

const signupUser = async (first_name, last_name, email, password, phone_number) => {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user in the database
    const user = await createUserInDatabase(first_name, last_name, email, hashedPassword, phone_number);
    if (!user) {
      throw new Error("Failed to create user");
    }

    // Generate the JWT token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      full_name: `${first_name} ${last_name}`,
    };
    const tokenOptions = { expiresIn: "7d" };
    const token = jwt.sign(tokenPayload, JWT_SECRET, tokenOptions);

    try {
      // await createUserInKlaviyo({ email, first_name, last_name, phone_number });
      // await createEventInKlaviyo('Signed Up', email);
      console.log("Created sign up event in Klaviyo");
    } catch (error) {
      console.error("Error in createUserInKlaviyo:", error);
    }

    return { token, expiresIn: tokenOptions.expiresIn };
  } catch (error) {
    // Handle duplicate email error
    if (error.message.includes("duplicate key value violates unique constraint")) {
      throw new Error("Email already exists");
    }

    console.error("Error during signupUser:", error);
    throw error;
  }
};

const signinUser = async (email, password) => {
  const user = await findUserByEmail(email);
  if (!user) {
    // Instead of throwing an error, we'll return a specific message
    return { error: "User not found" };
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    // Return a different message for incorrect password
    return { error: "Incorrect password" };
  }

  const full_name = `${user.first_name} ${user.last_name}`;
  const expiresIn = "7d";
  const token = jwt.sign({ userId: user.id, email: user.email, full_name: full_name }, JWT_SECRET, { expiresIn });

  // await createEventInKlaviyo('login', email);

  return { token, expiresIn };
};

const getSubscription = async (userId) => {
  const subscription = await getSubscriptionByUserId(userId);
  if (!subscription) {
    return { message: "No subscription found for this user." };
  }
  return subscription;
};

const createSubscription = async (userId, id, email, plan, endDate, startDate, provider, billingPeriod) => {
  try {
    const hasSubscription = await checkExistingSubscription(userId);
    if (hasSubscription) {
      return { success: false, error: 'User already has a subscription' };
    }
    const subscription = await createSubscriptionForUserId(userId, id, plan, endDate, startDate, provider, billingPeriod);

    try {
      // let mailOptions = {
      //   from: `"Kitty Care App" <${process.env.SMTP_USERNAME}>`,
      //   to: email,
      //   subject: 'Subscription Success',
      //   html: getSubscriptionSuccessTemplate(plan, endDate, startDate, billingPeriod),
      // };
      // await emailTransfer.sendMail(mailOptions);
      // await createEventInKlaviyo('Created Subscription', email);
      console.log("Created Subscription event in klaviyo");

      return { success: true, message: "Subscription success email sent", data: subscription };

    } catch (error) {
      console.error("Error sending subscription success email:", error);

      return { success: true, message: "Subscription created, but failed to send success email", data: subscription };
    }
  } catch (error) {
    throw error;
  }
};

const updateSubscription = async (subscriptionId, userId, plan, endDate, startDate, provider, billingPeriod) => {
  const subscription = await updateSubscriptionForUserId(subscriptionId, userId, plan, endDate, startDate, provider, billingPeriod);
  if (!subscription) {
    throw new Error("Subscription not found");
  }
  return subscription;
};

const deleteSubscription = async (subscriptionId, userId) => {
  try {
    // Define the cancellation date (current date only, in YYYY-MM-DD format)
    const endDate = new Date().toISOString().split("T")[0]; // Extracts just the date part
    const user = await findUserById(userId); // Assuming this function retrieves user details
    console.log("userId", userId);
    console.log("user", user);
    if (!user) {
      return { success: false, error: "User not found", status: 404 };
    }

    const username = `${user.user_metadata.first_name} ${user.user_metadata.last_name}`;
    const subscription = await getSubscriptionByUserId(userId);
    if (!subscription) {
      return { success: false, error: "Subscription not found", status: 404 };
    }
    // Send a cancellation email
    // const mailOptions = {
    //   from: `"Kitty Care App" <${process.env.SMTP_USERNAME}>`,
    //   to: user.email,
    //   subject: "Subscription Canceled",
    //   html: getSubscriptionCancelTemplate(username, endDate, subscription.plan, subscription.billing_period),
    // };

    // await emailTransfer.sendMail(mailOptions);
    console.log("Cancellation email sent successfully");

    // await createEventInKlaviyo('Canceled Subscription', user.email);
    console.log("Created Subscription Cancel event in klaviyo");

    // Attempt to delete the subscription
    const result = await deleteSubscriptionForUserId(subscriptionId, userId);

    if (result.error === "not_found") {
      return { success: false, error: "Subscription not found", status: 404 };
    } else if (result.error === "not_authorized") {
      return {
        success: false,
        error: "User not authorized to delete this subscription",
        status: 403,
      };
    } else if (!result.success) {
      return {
        success: false,
        error: "Failed to delete subscription",
        status: 500,
      };
    }

    return {
      success: true,
      message: "Subscription deleted successfully",
      status: 200,
    };
  } catch (error) {
    console.error("Error during subscription deletion:", error);
    return {
      success: false,
      error: "An error occurred during subscription deletion",
      status: 500,
    };
  }
};


const getCatDetails = async (userId, catId) => {
  try {
    const cat = await getCatDetailsById(userId, catId);
    if (!cat) {
      throw new Error("Cat not found");
    }
    return cat;
  } catch (error) {
    throw error;
  }
};

const getCats = async (userId) => {
  try {
    const cats = await getCatsByUserId(userId);
    return cats.length > 0 ? cats : { message: "No cats found for this user." };
  } catch (error) {
    throw error;
  }
};

const getCatById = async (userId, catId) => {
  try {
    const cat = await getCatByUserId(userId, catId);
    return cat !== null ? cat : { message: "No cat found for this user." };
  } catch (error) {
    throw error;
  }
};

const createCat = async (userId, userEmail, catData) => {
  try {
    const cat = await createCatByUserId(userId, catData);

    // await createEventInKlaviyo('Created the cat', userEmail);
    console.log("Created cat event in klaviyo");
    return cat;
  } catch (error) {
    throw error;
  }
};

const uploadPhoto = async (catId, photoData) => {
  try {
    if (!photoData) {
      throw new Error('Invalid photo data');
    }
    const result = await uploadPhotoToSupabase(catId, photoData);
    return result;
  } catch (error) {
    throw error;
  }
};

const updateCatRecommendations = async (catId, recommendations) => {
  const cat = await updateCatRecommendationsByCatId(catId, recommendations);
  return cat;
};

const updateCat = async (catId, userId, catData) => {
  const updatedCat = await updateCatById(catId, userId, catData);
  if (!updatedCat) {
    throw new Error("Cat not found");
  }

  // Check if we need to update AI recommendations
  if (catData.weight || catData.activity_level) {
    const aiRecommendations = await openaiService.getRecommendations(updatedCat);
    const finalUpdatedCat = await updateCatRecommendationsByCatId(catId, aiRecommendations);
    return finalUpdatedCat;
  }

  return updatedCat;
};

const deleteCat = async (catId, userId) => {
  const result = await deleteCatById(catId, userId);

  if (result.error === "not_found") {
    return { success: false, error: "Cat not found", status: 404 };
  } else if (result.error === "not_authorized") {
    return {
      success: false,
      error: "User not authorized to delete this cat",
      status: 403,
    };
  } else if (!result.success) {
    return {
      success: false,
      error: "Failed to delete cat",
      status: 500,
    };
  }

  return {
    success: true,
    message: "Cat deleted successfully",
    status: 200,
  };
};

const getConversations = async (userId) => {
  try {
    const conversations = await getConversationsByUserId(userId);
    return conversations.length > 0 ? conversations : { message: "No conversations found for this user." };
  } catch (error) {
    throw error;
  }
};

const handleChatMessage = async (conversation_id, user_id, content, role) => {
  try {
    // First, check if the conversation exists
    const conversationExists = await checkConversationExists(conversation_id);
    if (!conversationExists) {
      throw new Error('Conversation not found');
    }

    const newMessage = await createMessage(conversation_id, user_id, content, role);

    const user = await findUserById(user_id); // Assuming this function retrieves user details
    if (!user) {
      return { success: false, error: "User not found", status: 404 };
    }
    // await createEventInKlaviyo(`Wrote message: ${content}`, user.email);
    console.log("Created message event in klaviyo");

    return {
      conversation_id: conversation_id,
      message: newMessage
    };
  } catch (error) {
    console.error("Error in handleChatMessage:", error);
    throw error;
  }
};

const checkUserExists = async (userId) => {
  const user = await findUserById(userId);
  return user !== null;
};

const checkConversationExists = async (conversationId) => {
  const conversation = await getConversationById(conversationId);
  return conversation !== null;
};

const deleteConversation = async (conversationId, userId) => {
  const result = await deleteConversationById(conversationId, userId);

  if (result.error === "not_found") {
    return { success: false, error: "Conversation not found", status: 404 };
  } else if (result.error === "not_authorized") {
    return {
      success: false,
      error: "User not authorized to delete this conversation",
      status: 403,
    };
  } else if (!result.success) {
    return {
      success: false,
      error: "Failed to delete conversation",
      status: 500,
    };
  }

  return {
    success: true,
    message: "Conversation deleted successfully",
    status: 200,
  };
};

const createNewConversation = async (userId, startedAt) => {
  try {
    const conversation = await createConversation(userId, startedAt);
    return conversation;
  } catch (error) {
    console.error("Error in createNewConversation:", error);
    throw error;
  }
};

const updateConversation = async (conversationId, userId, messages) => {
  try {
    for (const message of messages) {
      await createMessage(conversationId, userId, message.content, message.role);
    }

    return { success: true, message: "Conversation updated successfully" };
  } catch (error) {
    if (error.message.includes("messages_conversation_id_fkey")) {
      return null; // This will be caught in the controller and return a 404
    }
    throw error;
  }
};

const getConversationByConversationId = async (userId, conversationId) => {
  try {
    const conversation = await getConversationsByConversationId(userId, conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    return conversation;
  } catch (error) {
    if (error.code === 'PGRST116') {
      return null; // Conversation not found
    }
    throw error;
  }
};

const requestPasswordReset = async (email) => {
  try {
    // Find the user by email
    const user = await findUserByEmail(email);
    if (!user) {
      return { error: true, message: "User not found" };
    }

    // Define expiration time and calculate the expiration timestamp
    const expiresIn = 3600 * 1000; // 1 hour in milliseconds
    const expirationTime = new Date(Date.now() + expiresIn);

    // Generate the token
    const token = jwt.sign(
      { userId: user.id, email: user.email, full_name: `${user.first_name} ${user.last_name}` },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Save the token and expiration in the database
    await savePasswordResetToken(user.id, token, expirationTime);

    // Send the reset email
    // const mailOptions = {
    //   from: `"Kitty Care App" <${process.env.SMTP_USERNAME}>`,
    //   to: user.email,
    //   subject: "Password Reset",
    //   html: getResetPasswordHtmlTemplate(token),
    // };

    // const info = await emailTransfer.sendMail(mailOptions);
    console.log("Email sent successfully:", info);

    // await createEventInKlaviyo("Request reset password", user.email);
    console.log("Created request resetting password event in klaviyo");

    return { success: true, message: "Password reset email sent" };
  } catch (error) {
    console.error("Error in requestPasswordReset:", error);
    return { error: true, message: "An error occurred while processing the request" };
  }
};

const resetPassword = async (token, newPassword) => {
  // Find token in the database and check expiration (pseudo-code)
  const resetToken = await findPasswordResetToken(token);

  if (!resetToken || resetToken.expires < Date.now()) {
    // throw new Error("Token is invalid or has expired");
    return { success: false, message: "Token is invalid or has expired" };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await updateUserPassword(resetToken.user_id, hashedPassword);

  // await createEventInKlaviyo("Password updated", user.email);
  console.log("Created updated password event in klaviyo");

  // Optionally, delete the token after use
  await deletePasswordResetToken(token);

  return { success: true, message: "Password has been reset" };
};

const signinWithOTP = async (email) => {
  try {
    const { data, error } = await signInWithOTP(email);

    if (error) {
      return { error: error.message };
    }

    // await createEventInKlaviyo('Requested OTP Login', email);
    return { data };
  } catch (error) {
    console.error('Error in signinWithOTP:', error);
    throw error;
  }
};

const verifyOTP = async (email, token, type) => {
  try {
    const { data, error } = await verifyOTPFromSupabase(email, token, type);

    if (error) {
      return { error: error.message };
    }

    // try {
    //   await createEventInKlaviyo('Verified OTP', email);
    // } catch (error) {
    //   console.error('Error in create event in klaviyo:', error);
    // }

    return data;
  } catch (error) {
    console.error('Error in verifyOTP:', error);
    throw error;
  }
};

const signupWithOTP = async (email, first_name, last_name, phone_number) => {
  try {
    // Then send the OTP with user metadata
    let { data, error } = await signInWithOTP(email, {
      shouldCreateUser: true,
      data: {
        first_name,
        last_name,
        phone_number
      }
    });

    if (error) {
      return { error: error.message };
    }

    // try {
    //   await createUserInKlaviyo({ email, first_name, last_name, phone_number });
    //   await createEventInKlaviyo('Signed Up with OTP', email);
    // } catch (error) {
    //   console.error('Error in create event in klaviyo:', error);
    // }

    return data;
  } catch (error) {
    console.error('Error in signupWithOTP:', error);
    throw error;
  }
};

module.exports = {
  signupUser,
  signinUser,
  getSubscription,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  getCats,
  createCat,
  updateCatRecommendations,
  updateCat,
  deleteCat,
  getConversations,
  handleChatMessage,
  checkUserExists,
  checkConversationExists,
  deleteConversation,
  getCatDetails,
  createNewConversation,
  updateConversation,
  createConversation,
  getConversationByConversationId,
  uploadPhoto,
  requestPasswordReset,
  resetPassword,
  signinWithOTP,
  verifyOTP,
  signupWithOTP,
  getCatById
};
