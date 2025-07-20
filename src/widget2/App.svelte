<script lang="ts">
    import { onMount, setContext } from "svelte";
    import { Button } from "deskblocks";
    import { APP, initApp } from "../lib/util";

    onMount(async () => {
        await initApp();
        console.log($APP);
    });
</script>

<main>
    <h1>UserPreference</h1>
    <Button>Save</Button>
    <Button variant="secondary">Cancel</Button>
</main>
