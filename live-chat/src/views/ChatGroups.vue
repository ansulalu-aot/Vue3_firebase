<template>
  <div class="container">
    <Navbar />
    <h2><u>Chat Groups</u></h2>
    <ul>
      <li v-for="group in chatGroups" :key="group.id">
        <router-link
          :to="{ name: 'Chatroom', params: { groupId: group.id } }" class="custom-link"
          >{{ group.name }}</router-link
        >
      </li>
    </ul>
  </div>
</template>

<script>
import useCollection from "../composables/useCollection";
import Navbar from "../components/Navbar.vue";
import getUser from "../composables/getUser";
import { watch, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { projectFirestore } from "../firebase/config";
import { or, where, collection, query, getDocs } from "firebase/firestore";

export default {
  components: { Navbar },
  name: "ChatGroups",
  setup() {
    const { user } = getUser();
    const router = useRouter();
    const chatGroups = ref([]);
    const error = ref(null);

    // Fetch chat groups based on user permissions
    const fetchChatGroups = async () => {
      try {
        const chatGroupsCollection = projectFirestore.collection("chatGroups");

        // Build the query based on user permissions
        let query = chatGroupsCollection.where("isPrivate", "==", false);
        if (user.value) {
         query = query.where(`registeredUsers.${user.value.email}`, "==", true);
          console.log("user.value.email :" , user.value.email)
        }
 // Debug: Log the query being executed
    console.log("Query:", query.toString());
        // Execute the query
        const snapshot = await query.get();
        chatGroups.value = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        // If the user is a superadmin, fetch all groups
        if (user.value && user.value.role === "superadmin") {
          const allGroupsSnapshot = await chatGroupsCollection.get();
          const allGroups = allGroupsSnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          }));
          chatGroups.value = allGroups;
        }
      } catch (err) {
        console.error(err.message);
        error.value = "Could not fetch chat groups.";
      }
    };

    // Watch for changes in user and fetch chat groups accordingly
    watch(user, () => {
      chatGroups.value = []; // Clear existing chat groups
      error.value = null; // Clear error

      if (!user.value) {
        router.push({ name: "Welcome" });
      } else {
        fetchChatGroups(); // Fetch chat groups based on user permissions
      }
    });

    // Fetch chat groups on component mount
    onMounted(() => {
      fetchChatGroups();
    });

    return {
      chatGroups,
      error,
    };
  },
};
</script>

<style>
h2 {
  text-align: center;
}
li {
  list-style: none;
  padding-bottom: 15px;
}
.custom-link {
  text-decoration: none;
  color: black;
}
</style>
