<template>
  <div class="container">
    <Navbar />
    <h2><u>Chat Groups</u></h2>
    <ul>
      <li v-for="group in chatGroups" :key="group.id">
        <router-link
          :to="{ name: 'Chatroom', params: { groupId: group.id } }"
          class="custom-link"
          >{{ group.name }}</router-link
        >
      </li>
    </ul>
  </div>
</template>

<script>
import Navbar from "../components/Navbar.vue";
import { watch, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { projectFirestore } from "../firebase/config";
import { user, getUserRole } from "../composables/getUser";

export default {
  components: { Navbar },
  name: "ChatGroups",
  setup() {
    const router = useRouter();
    const chatGroups = ref([]);
    const error = ref(null);

    // Fetch chat groups based on user permissions
    const fetchChatGroups = async () => {
      try {
        const chatGroupsCollection = projectFirestore.collection("chatGroups");
        const queryPromises = [];

        if (user.value) {
          // Use async/await to get the user's role
          const userRole = await getUserRole();

          // If the user is a superadmin, fetch all groups
          if (userRole === "superadmin") {
            queryPromises.push(
              chatGroupsCollection.get().then((querySnapshot) => {
                const allGroups = [];

                querySnapshot.forEach((doc) => {
                  if (doc.exists) {
                    allGroups.push({
                      ...doc.data(),
                      id: doc.id,
                    });
                  }
                });
                return allGroups;
              })
            );
          } else {
            // Fetch public groups
            queryPromises.push(
              chatGroupsCollection
                .where("isPrivate", "==", false)
                .get()
                .then((querySnapshot) => {
                  const publicGroups = [];

                  // Iterate through the query results for public groups
                  querySnapshot.forEach((doc) => {
                    if (doc.exists) {
                      publicGroups.push({
                        ...doc.data(),
                        id: doc.id,
                      });
                    }
                  });
                  return publicGroups;
                })
            );

            // Fetch permitted private groups for other logged-in users
            queryPromises.push(
              (async () => {
                const permittedGroups = [];
                const querySnapshot = await chatGroupsCollection
                  .where("isPrivate", "==", true)
                  .get();

                for (const doc of querySnapshot.docs) {
                  const groupId = doc.id;
                  // Check if there is a corresponding document in registeredUsers
                  const registeredUserDocRef = projectFirestore
                    .collection("chatGroups")
                    .doc(groupId)
                    .collection("registeredUsers")
                    .doc(user.value.email);
                  const registeredUserDoc = await registeredUserDocRef.get();

                  if (registeredUserDoc.exists) {
                    // The user has access to this private group
                    permittedGroups.push({
                      ...doc.data(),
                      id: groupId,
                    });
                  }
                }

                return permittedGroups;
              })()
            );
          }
        }

        const queryResults = await Promise.all(queryPromises);
        // Concatenate and map the results
        const Groups = [].concat.apply([], queryResults);
        const groups = Groups.map((doc) => ({
          ...doc,
        }));
        chatGroups.value = groups;
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
