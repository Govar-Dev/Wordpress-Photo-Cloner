<template>
    <div id="app">
        <section class="gallery-block grid-gallery">
            <div class="mx-3">
                <div class="row">
                    <template v-if="images.length">
                        <div v-for="(image,i) in images" :key="i" class="col-4 item" :style="image.checked ? '' : 'opacity:0.5'">
                            <a @click="image.checked = !image.checked" href="#">
                                <img class="img-fluid image scale-on-hover" :src="image.url">
                            </a>
                        </div>
                    </template>
                    <template v-else>
                        <div class="container">
                            <h6 class="text-center w-100">Please Enter URL and Search for URL.</h6>
                        </div>
                    </template>
                </div>
            </div>
        </section>
        <section class="footer">
            <div class="row">
                <div class="col">
                    <div class="input-group mb-2">
                        <input id="url" v-model="url" type="text" class="form-control" placeholder="Enter URL Here...">
                        <div class="input-group-append">
                            <button @click="search(url)" class="btn btn-primary" type="button">Search</button>
                        </div>
                    </div>
                </div>
                <div class="col-auto">
                    <button @click="download()" :disabled="!url || !images.filter(x=> x.checked).length" class="btn btn-success" type="button">Download ({{ images.filter(x=> x.checked).length }}) Photos</button>
                </div>
            </div>
        </section>
    </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import axios from 'axios';

export default {
    name: 'App',
    data() {
        return {
            url: '',
            images: []
        }
    },
    methods: {
        emitMain(name, data = null) {
            if (data) {
                ipcRenderer.send(name, data)
            } else {
                ipcRenderer.send(name)
            }
        },
        search(url) {

            try {
                // const slug = new URL(url).searchParams.get('slug');
                const slug = new URL(url).pathname.replace('/', '');
                const wp_base_url = ''

                axios.get(`${wp_base_url}/wp-json/wp/v2/posts?slug=${slug}`)
                    .then(response => {
                        var parser = new DOMParser();
                        var doc = parser.parseFromString(response.data[0]['content']['rendered'], 'text/html');
                        this.images = []
                        if (doc.querySelectorAll('img')) {
                            doc.querySelectorAll('img').forEach(el => {
                                this.images.push({
                                    checked: true,
                                    url: el.getAttribute('data-pk-src')
                                })
                            });
                        } else {
                            alert('Can\'t seach, please write correct url.')
                        }

                    })
                    .catch(err => {
                        alert('Can\'t seach, please write correct url.')
                    })
            } catch (error) {
                alert('Can\'t seach, please write correct url.')
            }
        },

        download() {
            try {

            } catch (error) {
                alert('Can\'t Download, please try again.')

            }
            let images = this.images.filter(x => x.checked).map(x => x.url)
            const slug = new URL(this.url).pathname.replace('/', '');

            this.emitMain('downloadImages', [slug, images])
        }


    },
    mounted() {
        this.emitMain('setTitle', 'Photo Cloner')

        window.addEventListener('contextmenu', (e) => {
            e.preventDefault()
            ipcRenderer.send('show-context-menu')
        })


        document.addEventListener('keydown', (e) => {
            if (e.target.id == 'url') {
                return true;
            }

            if (e.ctrlKey && e.key === 'a') {
                let firstChecked = !this.images[0].checked
                this.images.forEach(image => {
                    image.checked = firstChecked
                });
                e.preventDefault()
            }
        });





        ipcRenderer.on('context-menu-command', (e, command) => {
            if (command.name && command.name == 'downloading') {

                if (command.now == command.all) {
                    alert('Download Complete: ' + command.now + ' files of ' + command.all)
                }
            } else {

                switch (command) {
                    case "select-all":
                        this.images.forEach(image => {
                            image.checked = true
                        });
                        break;
                    case "un-select-all":
                        this.images.forEach(image => {
                            image.checked = false
                        });
                        break;
                    case "about":
                        alert("Developed By: Govar Jabar")
                        break;

                    default:
                        break;
                }
            }

        })



    },

}
</script>

<style>
@import url("https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css");

::-webkit-scrollbar {
    background-color: #fff;
    width: 10px;
}

/* background of the scrollbar except button or resizer */
::-webkit-scrollbar-track {
    background-color: #fff;
}
::-webkit-scrollbar-track:hover {
    background-color: #f4f4f4;
}

/* scrollbar itself */
::-webkit-scrollbar-thumb {
    background-color: #babac0;
}
::-webkit-scrollbar-thumb:hover {
    background-color: #a0a0a5;
}

/* set button(top and bottom of the scrollbar) */
::-webkit-scrollbar-button {
    display: none;
}

body {
    background-color: #fefefe;
}

.gallery-block.grid-gallery {
    padding-bottom: 10px;
    padding-top: 10px;
    overflow-y: scroll;
    height: 90%;
    position: absolute;
}

.gallery-block.grid-gallery a:hover {
    opacity: 0.8;
}

.gallery-block.grid-gallery .item img {
    box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.15);
    transition: 0.4s;
}

.gallery-block.grid-gallery .item {
    margin-bottom: 20px;
}

@media (min-width: 576px) {
    .gallery-block.grid-gallery .scale-on-hover:hover {
        transform: scale(1.05);
        box-shadow: 0px 10px 10px rgba(0, 0, 0, 0.15) !important;
    }
}

.footer {
    position: fixed;
    width: 100%;
    bottom: 0;
    padding: 10px 10px 0px 10px;
    background: linear-gradient(90deg, #1c2e51 0%, #182848 100%);
}
</style>
