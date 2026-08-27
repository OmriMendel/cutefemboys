const express = require('express');
const app = express();

const limit = 1;
const apiKey = "e154d25fd829562d05143096818747c03d25238896a92e3a914ff8c14a41e0c4d84645b02894b1f34da73c5e2bb79df30d8f65c9a0dfc2cb4f2e10f0710f8270";
const userID = "6048827";
const BASE_API_URL = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&limit=${limit}&api_key=${apiKey}&user_id=${userID}&pid=`; 

app.get("/api/random", async (req, res) => {
    try {
        const response = await fetch(`${BASE_API_URL}1&tags=femboy+sort:random`);
        const data = await response.json();

        if (data && data.length > 0) {
            const firstItem = data[0];
            const imageUrl = firstItem.sample_url || firstItem.file_url || firstItem.preview_url;
            
            res.redirect(imageUrl); 
        } else {
            res.status(404).send("Image not found");
        }
    } catch (error) {
        res.status(500).send("Server Error");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
