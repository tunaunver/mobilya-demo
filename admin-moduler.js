const supabase = window.supabase.createClient(
    "https://nnweywzddgtwrnwjnssx.supabase.co",
    "sb_publishable_t7Nnnb8fZOAw8hx8bkggnw_gpNmuqLP"
);
async function testDB() {
    const { data, error } = await supabase
        .from("products")
        .select("*");

    console.log("DATA:", data);
    console.log("ERROR:", error);
}

testDB();