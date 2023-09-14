import { ref } from "vue";
import { projectAuth, projectFirestore } from "@/firebase/config";

const user = ref(null);

projectAuth.onAuthStateChanged(async (_user) => {
  console.log("User state change. Current user is:", _user);
  user.value = _user;
});

const getUserRole = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      if (user.value) {
        const superusersRef = projectFirestore.collection("superusers");
        const superusersSnapshot = await superusersRef
          .where("emails", "array-contains", user.value.email)
          .get();
console.log("superusersSnapshot :" , superusersSnapshot)
        if (!superusersSnapshot.empty) {
          console.log("role : superadmin"  )
          resolve("superadmin");
        } else {
          console.log("role : user"  )
          resolve("user");
        }
      } 
      // else {
      //   console.log("role : unauthenticated"  )
      //   reject("User is not authenticated");
      // }
    } catch (error) {
      reject(error);
    }
  });
};

export { user, getUserRole };
