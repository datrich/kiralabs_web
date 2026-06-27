async function runCatVTONTryOn({ personFile, clothFile, clothType }) {
  const formData = new FormData();
  formData.append("person_image", personFile);
  formData.append("cloth_image", clothFile);
  formData.append("cloth_type", clothType);

  const response = await fetch("http://localhost:8000/api/try-on", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.detail?.error || data?.error || "Try-on request failed");
  }

  return data;
}

// Example:
// const personFile = document.querySelector("#person").files[0];
// const clothFile = document.querySelector("#cloth").files[0];
// const result = await runCatVTONTryOn({
//   personFile,
//   clothFile,
//   clothType: "upper",
// });
// document.querySelector("#result").src = result.result_image_url;
