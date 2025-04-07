const axios = require("axios");
const qs = require("qs");

const getDateRangeFromDuckling = async (query) => {
  try {
    const now = new Date();
    const reftime = now.toISOString(); // Use current date/time

    const response = await axios.post(
      "http://localhost:8000/parse",
      qs.stringify({
        text: query,
        locale: "en_US",
        reftime, // Tell Duckling to treat "now" as this
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const timeEntity = response.data.find((d) => d.dim === "time");
    if (!timeEntity) return null;

    const { value } = timeEntity;

    if (value.type === "interval") {
      return {
        start: new Date(value.from.value).toISOString(),
        end: new Date(value.to.value).toISOString(),
      };
    } else if (value.type === "value") {
      const start = new Date(value.value);
      const end = new Date(value.value);
      start.setUTCHours(0, 0, 0, 0);
      end.setUTCHours(23, 59, 59, 999);
      return { start: start.toISOString(), end: end.toISOString() };
    }

    return null;
  } catch (err) {
    console.error("Duckling error:", err.message);
    return null;
  }
};


module.exports = { getDateRangeFromDuckling };
