<template>
  <div class="chat-window">
    <button @click="goBack">Go Back</button>
    <div class="public-private">
      <div v-if="superAdmin === 'superadmin'">
        <input
          type="radio"
          v-model="isPrivate"
          :value="false"
          @click="updateIsPrivate(false)"
        />
        Public
        <input
          type="radio"
          v-model="isPrivate"
          :value="true"
          @click="updateIsPrivate(true)"
        />
        Private
        <div v-if="permittedEmails.length > 0 && isPrivate" class="styling">
          <h3>Permitted Emails:</h3>
          <ul>
            <li
              v-for="(email, index) in permittedEmails"
              :key="email"
              v-show="index === 0 || isExpanded"
            >
              {{ email }}
              <b @click="deletePermittedEmail(email)">❌</b>
            </li>
          </ul>
          <b @click="toggleEmailList">{{ isExpanded ? "▼" : "▲" }}</b>
        </div>
        <div v-if="isPrivate">
          <label for="permissionEmails">Enter permission email IDs : </label>
          <input type="text" id="permissionEmails" v-model="permissionEmails" />
          <button @click="updateGroupPrivacy">Add</button>
        </div>
      </div>
    </div>
    <div v-if="error">{{ error }}</div>
    <h2>
      <u>{{ groupName }}</u>
    </h2>
    <div v-if="groupMessages" class="messages" ref="messages">
      <div v-for="doc in groupMessages" :key="doc.id">
        <div class="message-container">
          <div
            :class="[
              'single',
              { sender: doc.isSender, receiver: !doc.isSender },
            ]"
          >
            <span class="created-at">{{ doc.createdAt }}</span>
            <span class="name">{{ doc.name }}</span>
            <span class="message">{{ doc.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onUpdated, ref, onMounted } from "vue";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "vue-router";
import useCollection from "../composables/useCollection";
import { user, getUserRole } from "../composables/getUser";
import { projectFirestore } from "../firebase/config";

export default {
  props: {
    groupId: String,
  },
  setup(props) {
    const router = useRouter();
    const isPrivate = ref(false);
    const permissionEmails = ref("");
    const permittedEmails = ref([]); // Store permitted emails
    const isExpanded = ref(false); // Initially, the email list is collapsed
    const superAdmin = ref("");
    const groupName = ref("");

    // Use the useCollection utility to fetch messages for the specified group
    const { error, documents } = useCollection(
      `chatGroups/${props.groupId}/messages`
    );

    // Get the group name based on groupId
    const getGroupName = async () => {
      const groupRef = projectFirestore.doc(`chatGroups/${props.groupId}`);
      const groupSnapshot = await groupRef.get();
      if (groupSnapshot.exists) {
        groupName.value = groupSnapshot.data().name;
        isPrivate.value = groupSnapshot.data().isPrivate;
      }
    };

    getGroupName(); // Call the function to get the group name

    // Method to update isPrivate in Firestore
    const updateIsPrivate = async (value) => {
      const groupRef = projectFirestore.doc(`chatGroups/${props.groupId}`);
      try {
        await groupRef.update({ isPrivate: value });
      } catch (error) {
        console.error(error);
      }
    };

    const updateGroupPrivacy = async () => {
      const groupRef = projectFirestore.doc(`chatGroups/${props.groupId}`);
      const registeredUsersRef = groupRef.collection("registeredUsers");

      try {
        if (isPrivate.value) {
          // Split permissionEmails into an array of email addresses
          const emailArray = permissionEmails.value.split(",");

          // Remove any leading/trailing whitespace from email addresses
          const cleanEmails = emailArray.map((email) => email.trim());

          // Add new emails to registeredusers subcollection
          const addEmail = cleanEmails.map(async (email) => {
            const emailDocRef = registeredUsersRef.doc(email);
            const emailDocSnapshot = await emailDocRef.get();

            if (!emailDocSnapshot.exists) {
              // Only add the email if it doesn't already exist
              return emailDocRef.set({});
            }

            return null; // Email already exists, no need to add it again
          });

          await Promise.all(addEmail);

          permissionEmails.value = ""; // Clear the input field
        }
      } catch (error) {
        console.error(error);
      }
    };

    // Computed property to filter and format messages based on groupId
    const groupMessages = computed(() => {
      if (documents.value && user.value) {
        return documents.value.map((doc) => {
          let time = formatDistanceToNow(doc.createdAt.toDate());
          const isSender = doc.name === user.value.displayName;
          return { ...doc, createdAt: time, isSender: isSender };
        });
      }
    });

    // Auto-scroll to bottom of messages
    const messages = ref(null);
    onUpdated(() => {
      if (messages.value) {
        messages.value.scrollTop = messages.value.scrollHeight;
      }
    });

    // to navigate back in history
    const goBack = () => {
      router.back();
    };

    const fetchPermittedEmails = async () => {
      try {
        const permittedEmailsRef = projectFirestore.collection(
          `chatGroups/${props.groupId}/registeredUsers`
        );

        // Fetch documents in the registeredUsers subcollection
        const snapshot = await permittedEmailsRef.get();

        // Map the documents to email addresses
        const emails = snapshot.docs.map((doc) => doc.id);

        permittedEmails.value = emails;
      } catch (error) {
        console.error(error);
      }
    };

    // Call the function to fetch permitted emails when the component mounts
    onMounted(async () => {
      superAdmin.value = await getUserRole();
      if (superAdmin.value === "superadmin") {
        fetchPermittedEmails();
      }
    });

    // Function to delete a permitted email
    const deletePermittedEmail = async (emailToDelete) => {
      const groupRef = projectFirestore.doc(`chatGroups/${props.groupId}`);
      const registeredUsersRef = groupRef.collection("registeredUsers");

      try {
        // Delete the specified email document from the subcollection
        await registeredUsersRef.doc(emailToDelete).delete();

        // Remove the email from the permittedEmails array
        permittedEmails.value = permittedEmails.value.filter(
          (email) => email !== emailToDelete
        );
      } catch (error) {
        console.error(error);
      }
    };
    const toggleEmailList = () => {
      isExpanded.value = !isExpanded.value; // Toggle the state
    };

    return {
      error,
      groupName,
      groupMessages,
      messages,
      goBack,
      isPrivate,
      permissionEmails,
      updateGroupPrivacy,
      updateIsPrivate,
      permittedEmails,
      deletePermittedEmail,
      isExpanded,
      toggleEmailList,
      superAdmin,
    };
  },
};
</script>

<style>
.chat-window {
  background: #fafafa;
  padding: 30px 20px;
}
.message-container {
  display: flex;
  flex-direction: column;
}
.single {
  margin: 10px 0;
  max-width: 80%;
  word-wrap: break-word;
  padding: 8px;
  border-radius: 10px;
}
.created-at {
  display: block;
  color: #999;
  font-size: 12px;
  margin-bottom: 4px;
}
.name {
  font-weight: bold;
  margin-right: 6px;
}
.messages {
  max-height: 400px;
  overflow: auto;
}
.sender {
  margin-right: 5px;
  align-self: flex-end;
  background-color: #dcf8c6;
}
.receiver {
  align-self: flex-start;
  background-color: #f3f3f3;
}
.public-private {
  display: flex;
  justify-content: flex-end;
  text-align: right;
}
.styling {
  display: flex;
  align-items: center;
  justify-content: space-around;
}
b {
  cursor: pointer;
}
</style>
