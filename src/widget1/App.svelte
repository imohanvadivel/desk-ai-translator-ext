<script lang="ts">
    import { onMount } from "svelte";
    import { Button, Textarea, Select, FormLabel } from "deskblocks";
    import { APP, detectLanguage, getThread, initApp, languageCodes, translate } from "../lib/util";

    let text2Translate = "";
    let targetLanguage: any;
    let translatedText = ``;

    onMount(async () => {
        await initApp();

        let threadId = $APP?.meta.threadId as string;

        let ticketId: string;
        let data = await ZOHODESK.get("ticket");
        ticketId = data.ticket.id as string;

        let threadData = await getThread(ticketId, threadId);
        text2Translate = threadData.data.statusMessage.plainText;
    });

    async function translateContent() {
        const { confidence, detectedLanguage } = (await detectLanguage(text2Translate)) as {
            confidence: number;
            detectedLanguage: string;
        };

        if (confidence < 0.5) {
            throw new Error("unable to detect language");
        }

        let sourceLanguage = detectedLanguage;
        translatedText = (await translate(sourceLanguage, targetLanguage.value, text2Translate)) as string;
    }
</script>

<main>
    <div class="input-cnt">
        <Textarea class="textarea" bind:value={text2Translate} rows={12} placeholder="Enter the text to translate" />
        <div class="select-cnt">
            <FormLabel class="label">Target Language</FormLabel>
            <Select bind:value={targetLanguage} options={languageCodes} placeholder="choose the target language" />
        </div>

        <Button on:click={translateContent}>Translate</Button>
    </div>

    {#if translatedText}
        <p>{translatedText}</p>
    {/if}
</main>

<style>
    :global(html) {
        height: 100%;
    }

    :global(body) {
        height: 100%;
    }

    :global(#app) {
        height: 100%;
    }

    main {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .input-cnt {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding: 1rem;
        border-bottom: 1px solid var(--db-color-border);
    }

    .select-cnt {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    :global(.textarea) {
        line-height: 1.3;
    }

    :global(.label) {
        color: var(--db-color-text-secondary) !important;
    }

    p {
        font-size: 14px;
        line-height: 1.3;
        margin: 0;
        padding: 0;
        background-color: var(--db-color-bg-secondary);
        padding: 1rem;
        height: 100%;
    }
</style>
