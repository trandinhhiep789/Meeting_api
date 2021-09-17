let userList = [
  {
    id: 1,
    room: "eyeqroom",
    username: "eltr",
  },
  {
    id: 2,
    room: "eyeqroom",
    username: "eltr sc",
  },
];

// thêm mới user
//userList.push(...user)// sai
const addUser = (user) => (userList = [...userList, user]);

// xóa user
// const removeUser = (id) => {
//     const index = userList.findIndex(id)
//     if(index == -1){
//         userList.splice(index, 1)
//     }
// }

const removeUser = (id) =>
  (userList = userList.filter((user) => user.id !== id));

// get list user by room's name
const getListUserByRoom = (room) =>
  userList.filter((user) => user.room === room);

const getListUser = () => userList;

// get user by id
const getUserById = (id) => userList.find((user) => user.id === id);
const getUserByName = (name) => userList.find((user) => user.username === name);

module.exports = {
  addUser,
  removeUser,
  getListUserByRoom,
  getUserById,
  getListUser,
  getUserByName,
};
