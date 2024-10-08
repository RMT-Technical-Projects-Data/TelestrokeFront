//This is the Auth token, you will use it to generate a meeting and connect to it

export const getToken = async () => {
  // const res = await fetch(`http://localhost:9000/get-token`, {
  //   method: "GET",
  // });
  // //Destructuring the roomId from the response
  // const { token } = await res.json();
  // console.log(token);
  return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiJiZTkyNDhjNi01MjM3LTQxZjEtOGY3NS1hZGEyNTFmY2I0MjEiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIl0sImlhdCI6MTcyNTI1NTQ1NywiZXhwIjoxNzI3ODQ3NDU3fQ.Mwcwn4jWsK-H_eJdvGlrKqWA_Pk5ta8MAPmbOQKjFSY"
  // return token;
};

export const authToken = await getToken();
// API call to create a meeting
export const createMeeting = async ({ token }) => {
  const res = await fetch(`https://api.videosdk.live/v2/rooms`, {
    method: "POST",
    headers: {
      authorization: `${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  //Destructuring the roomId from the response
  const { roomId } = await res.json();
  return roomId;
};
