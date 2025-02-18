const supabaseService = require("../services/supabaseService");
const openaiService = require("../services/openaiService");

const signup = async (req, res) => {
    const { first_name, last_name, email, password, phone_number } = req.body;

    try {
        const { token, expiresIn } = await supabaseService.signupUser(
            first_name,
            last_name,
            email,
            password,
            phone_number,
        );
        res.status(201).json({ token, expiresIn });
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
            if (error.message === "Email already exists") {
                res.status(409).json({ message: "Email already in use" });
            } else if (
                error.message === "Invalid email format" ||
                error.message.startsWith("Password must be")
            ) {
                res.status(400).json({ message: error.message });
            } else {
                console.error(error);
                res.status(500).json({ message: "An unexpected error occurred" });
            }
        } else {
            console.error(error);
            res.status(500).json({ message: "An unexpected error occurred" });
        }
    }
};

const signin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await supabaseService.signinUser(email, password);

        if (result.error) {
            // Return the specific error to the client
            return res.status(401).json({ message: `${result.error}` });
        }

        res.json(result);
    } catch (error) {
        console.error("Signin error:", error);
        res.status(500).json({ message: "An error occurred during signin" });
    }
};

const getSubscription = async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await supabaseService.getSubscription(userId);

        if (result.message) {
            return res.status(404).json({ message: result.message });
        }

        res.json(result);
    } catch (error) {
        console.error("Get subscription error:", error);
        res
            .status(500)
            .json({ message: "An error occurred while fetching the subscription" });
    }
};

const createSubscription = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id, email, plan, end_date, start_date, provider, billing_period } = req.body;

        const result = await supabaseService.createSubscription(userId, id, email, plan, end_date, start_date, provider, billing_period);

        if (!result.success) {
            return res.status(400).json({ message: result.error });
        }

        res.status(201).json(result.data);
    } catch (error) {
        console.error("Create subscription error:", error);
        res.status(500).json({ message: "An error occurred while creating the subscription" });
    }
};

const updateSubscription = async (req, res) => {
    try {
        const userId = req.user.userId;
        const subscriptionId = req.params.id;
        const { plan, end_date, start_date, provider, billing_period } = req.body;

        const subscription = await supabaseService.updateSubscription(
            subscriptionId,
            userId,
            plan,
            end_date,
            start_date,
            provider,
            billing_period
        );
        res.json(subscription);
    } catch (error) {
        if (error.message === "Subscription not found") {
            res.status(404).json({ message: error.message });
        } else {
            console.error("Update subscription error:", error);
            res
                .status(500)
                .json({ message: "An error occurred while updating the subscription" });
        }
    }
};

const deleteSubscription = async (req, res) => {

    try {
        console.log("cancel #########");
        const { id } = req.params;
        const userId = req.user.userId;

        const result = await supabaseService.deleteSubscription(id, userId);

        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }

        res.status(200).json({ message: result.message });
    } catch (error) {
        console.error("Error in deleteSubscription controller:", error);
        if (error.message === "Subscription not found") {
            res.status(404).json({ message: "Subscription not found" });
        } else {
            res
                .status(500)
                .json({ message: "An error occurred while deleting the subscription" });
        }
    }
};

const getCats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await supabaseService.getCats(userId);

        if (result.message) {
            return res.status(404).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error("Get cats error:", error);
        res
            .status(500)
            .json({ message: "An error occurred while fetching the cats" });
    }
};

const getCatById = async (req, res) => {
    try {
        const userId = req.user.userId;
        const catId = req.params.id;

        const result = await supabaseService.getCatById(userId, catId);

        if (result.message) {
            return res.status(404).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error("Get cats error:", error);
        res
            .status(500)
            .json({ message: "An error occurred while fetching the cats" });
    }
};

const createCat = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userEmail = req.user.email;

        const { photo, ...catData } = req.body;
        const cat = await supabaseService.createCat(userId, userEmail, catData);

        const aiRecommendations = await openaiService.getRecommendations(cat);
        const updatedCat = await supabaseService.updateCatRecommendations(
            cat.id,
            aiRecommendations
        );

        if (photo) {
            const { data, error } = await supabaseService.uploadPhoto(photo, cat.id);
            if (error) {
                return res.status(500).json({ message: "An error occurred while uploading the photo" });
            }
            updatedCat.photo = data.url;
        }
        const finalCat = await supabaseService.updateCat(cat.id, userId, updatedCat);

        res.status(201).json(finalCat);
    } catch (error) {
        console.error("Create cat error:", error);
        res.status(500).json({ message: "An error occurred while creating the cat" });
    }
};

const updateCat = async (req, res) => {
    try {
        const userId = req.user.userId;
        const catId = req.params.id;
        const { photo, ...catData } = req.body;

        const updatedCat = await supabaseService.updateCat(catId, userId, catData);
        if (photo) {
            try {
                const data = await supabaseService.uploadPhoto(catId, photo);
                updatedCat.photo = data?.url || null;
            } catch (error) {
                console.error("Update cat error:", error);
                return res.status(500).json({ message: "An error occurred while uploading the photo" });
            }
        }
        const finalUpdatedCat = await supabaseService.updateCat(catId, userId, updatedCat);

        res.json(finalUpdatedCat);
    } catch (error) {
        console.error("Update cat error:", error);
        if (error.message === "Cat not found") {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: "An error occurred while updating the cat" });
        }
    }
};

const deleteCat = async (req, res) => {
    try {
        const userId = req.user.userId;
        const catId = req.params.id;

        const result = await supabaseService.deleteCat(catId, userId);

        if (!result.success) {
            return res.status(result.status).json({ error: result.error });
        }

        res.status(200).json({ message: result.message });
    } catch (error) {
        console.error("Delete cat error:", error);
        res.status(500).json({ message: "An error occurred while deleting the cat" });
    }
};

const getConversations = async (req, res) => {
    try {
        const userId = req.user.userId;
        const conversationId = req.query.conversationId || null;
        const conversations = await supabaseService.getConversations(userId, conversationId);

        if (conversations.message) {
            return res.status(404).json({ message: conversations.message });
        }

        res.status(200).json(conversations);
    } catch (error) {
        console.error("Get conversations error:", error);
        res.status(500).json({ message: "An error occurred while fetching the conversations" });
    }
};

const postChatMessage = async (req, res) => {
    try {
        const { conversation_id, content, role } = req.body;
        const user_id = req.user.userId;

        // Check if the user exists
        const userExists = await supabaseService.checkUserExists(user_id);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found' });
        }

        const result = await supabaseService.handleChatMessage(conversation_id, user_id, content, role);

        res.status(201).json(result);
    } catch (error) {
        console.error("Post chat message error:", error);
        if (error.message === "Conversation not found") {
            res.status(404).json({ message: error.message });
        } else {
            // Change this line to return 500 for unexpected errors
            res.status(500).json({ message: 'An error occurred while processing the chat message' });
        }
    }
};

const deleteConversation = async (req, res) => {
    try {
        const userId = req.user.userId;
        const conversationId = req.params.id;

        const result = await supabaseService.deleteConversation(conversationId, userId);

        if (!result.success) {
            return res.status(result.status).json({ message: result.error });
        }

        res.status(200).json({ message: result.message });
    } catch (error) {
        console.error("Delete conversation error:", error);
        res.status(500).json({ message: "An error occurred while deleting the conversation" });
    }
};

const createConversation = async (req, res) => {
    try {
        const userId = req.user.userId;
        const started_at = new Date().toISOString();

        const result = await supabaseService.createConversation(userId, started_at);

        if (result.error) {
            return res.status(400).json({ message: result.error });
        }

        res.status(201).json({ id: result.id });
    } catch (error) {
        console.error("Create conversation error:", error);
        res.status(500).json({ message: "An error occurred while creating the conversation" });
    }
};

const updateConversation = async (req, res) => {
    try {
        const { id } = req.params;
        const { messages } = req.body;
        const userId = req.user.userId;

        const errors = [];
        if (!Array.isArray(messages)) {
            errors.push('"messages" must be an array');
        }

        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        const result = await supabaseService.updateConversation(id, userId, messages);

        if (!result) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        res.status(200).json(result);
    } catch (error) {
        if (error.message.includes("messages_conversation_id_fkey")) {
            res.status(404).json({ message: "Conversation not found" });
        } else {
            console.error("Update conversation error:", error);
            res.status(500).json({ message: "An error occurred while updating the conversation" });
        }
    }
};

const getAllConversations = async (req, res) => {
    try {
        const userId = req.user.userId;
        const conversations = await supabaseService.getConversations(userId);

        if (conversations.message) {
            return res.status(404).json({ message: conversations.message });
        }

        res.status(200).json(conversations);
    } catch (error) {
        console.error("Get all conversations error:", error);
        res.status(500).json({ message: "An error occurred while fetching the conversations" });
    }
};

const getConversationByConversationId = async (req, res) => {
    try {
        const userId = req.user.userId;
        const conversationId = req.params.id;
        const conversation = await supabaseService.getConversationByConversationId(userId, conversationId);

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found." });
        }

        res.status(200).json(conversation);
    } catch (error) {
        console.error("Get conversation by ID error:", error);
        res.status(500).json({ message: "An error occurred while fetching the conversation" });
    }
};

const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        const result = await supabaseService.requestPasswordReset(email);
        res.status(200).json(result);
    } catch (error) {
        console.error("Request password reset error:", error);
        res.status(500).json({ success: false, message: "An error occurred while requesting password reset" });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const result = await supabaseService.resetPassword(token, newPassword);
        res.status(200).json(result);
    } catch (error) {
        console.error("Reset password error:", error);
        if (error.message === "Token is invalid or has expired") {
            res.status(400).json({ success: false, message: error.message });
        } else {
            res.status(500).json({ success: false, message: "An error occurred while resetting the password" });
        }
    }
};

const signinWithOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const result = await supabaseService.signinWithOTP(email);

        if (result.error) {
            return res.status(400).json({ message: result.error });
        }

        res.status(200).json({
            message: 'OTP sent successfully',
            email: email
        });
    } catch (error) {
        console.error('Signin OTP error:', error);
        res.status(500).json({ message: 'An error occurred during OTP signin' });
    }
};

const verifyOTP = async (req, res) => {
    try {
        const { email, token, type } = req.body;
        const result = await supabaseService.verifyOTP(email, token, type);

        if (result.error) {
            return res.status(400).json({ message: result.error });
        }

        res.status(200).json({
            session: result.session,
            user: result.user
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ message: 'An error occurred during OTP verification' });
    }
};

const signupWithOTP = async (req, res) => {
    try {
        const { email, first_name, last_name, phone_number } = req.body;
        const result = await supabaseService.signupWithOTP(email, first_name, last_name, phone_number);

        if (result.error) {
            return res.status(400).json({ message: result.error });
        }

        res.status(200).json({
            message: 'OTP sent successfully',
            email: email,
            token: result.token
        });
    } catch (error) {
        console.error('Signup OTP error:', error);
        res.status(500).json({ message: 'An error occurred during OTP signup' });
    }
};

// Update the module.exports to include these new functions:
module.exports = {
    signup,
    signin,
    getSubscription,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    getCats,
    createCat,
    updateCat,
    deleteCat,
    getConversations,
    postChatMessage,
    deleteConversation,
    createConversation,
    updateConversation,
    getAllConversations,
    getConversationByConversationId,
    requestPasswordReset,
    resetPassword,
    signinWithOTP,
    verifyOTP,
    signupWithOTP,
    getCatById
};
