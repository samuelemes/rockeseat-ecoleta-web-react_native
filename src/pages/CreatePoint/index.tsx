import React, { useEffect, useState, ChangeEvent, FormEvent }from 'react';
import './stile.css';
import logo from '../../assets/logo.svg';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet';
import api from '../../services/api';
import axios from 'axios';
import { LeafletMouseEvent } from 'leaflet';

import { format } from 'path';

interface item {
    id: number;
    title: string;
    image_url: string;
}

interface IBGEUfResponse {
    sigla: string;
}

interface IBGECity {
    nome: string;
}

const CreatePoint = () => {
    const [ items, setItems] = useState<item[]>([]);
    const [ufs, setUFs] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    
    const [selectedUF, setSelectedUF] = useState('0');
    const [selectedCity, setSelectedCity] = useState('0');
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0,0]);
    const [initialPosition, setInitioalPosition] = useState<[number, number]>([0,0]);
    const [formData, setFormData] = useState({
        name: '',
        email:'',
        whatsapp: '',
    });
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const history = useHistory();

    useEffect(() => {
        api.get('items').then(response => {
            setItems(response.data);
        })
    }, []);

    useEffect( () => {
        axios.get<IBGEUfResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response => {
            const ufInitials = response.data.map(uf => uf.sigla);

            setUFs(ufInitials);
        });
    }, []);

    useEffect(() => {
        if(selectedUF === '0') 
            return;

            axios.get<IBGECity[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUF}/municipios`).then(response => {
                const citiesNames = response.data.map(city => city.nome);
    
                setCities(citiesNames);
            });
    }, [selectedUF]);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;

            setInitioalPosition([latitude, longitude]);
        })
    }, [selectedUF]);
    
    function handSelectUF(event: ChangeEvent<HTMLSelectElement>) {
        const uf = event.target.value;

        setSelectedUF(uf);
    }

    function handSelectCity(event: ChangeEvent<HTMLSelectElement>) {
        const city = event.target.value;

        setSelectedCity(city);
    }

    function handMapClick(event: LeafletMouseEvent) {
        setSelectedPosition([event.latlng.lat, event.latlng.lng]);
    }

    function handInputChange(event: ChangeEvent<HTMLInputElement>){
        const {name, value } = event.target;
        setFormData({ ...formData, [name]: value });
    }

    function handSelectItem(id: number){
        const alreadySelected = selectedItems.findIndex(item => item === id);

        if(alreadySelected >= 0){
            const filteredItems = selectedItems.filter(item => item !== id);
            setSelectedItems(filteredItems);
        }else{
            setSelectedItems([...selectedItems, id]);
        }
    }

    async function handSubmit(event: FormEvent){
        event.preventDefault();

        const { name, email, whatsapp } = formData;
        const uf = selectedUF;
        const city = selectedCity;
        const [latitude, longitude] = selectedPosition;
        const items = selectedItems;

        const data = {
            name,
            email,
            whatsapp,
            uf,
            city,
            latitude,
            longitude,
            items
        }
console.log(data);
        await api.post('points', data);
        alert ('Ponto de coleta criado!');
        history.push('/');
    }

    return (
        <div id="page-create-point">
            <header>
                <img src= {logo} alt="Ecoleta" />
                <Link to="/">
                    <FiArrowLeft />
                    Voltar para home
                </Link>
            </header>
            <form onSubmit={handSubmit}>
                <h1>Cadastro do <br />ponto de coleta</h1>
                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>
                </fieldset>
                <div className="field">
                    <label htmlFor="name">Nome da entidade</label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        onChange={handInputChange}
                    />
                </div>
                <div className="field-group">
                    <div className="field">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                        onChange={handInputChange}

                        />
                    </div>
                    <div className="field">
                        <label htmlFor="whatsapp">WhatsApp</label>
                        <input
                            type="text"
                            name="whatsapp"
                            id="whatsapp"
                        onChange={handInputChange}

                        />
                    </div>
                </div>


                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Seleciona o endereço no mapa</span>
                    </legend>

                    <Map center={initialPosition} zoom={ 15 } onclick={handMapClick}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                        <Marker position={selectedPosition} />
                    </Map>

                    <div className="field-group">
                        <div className='field'>
                            <label htmlFor="uf">Estado (UF)</label>
                            <select name="uf" id="uf" value={selectedUF} onChange={handSelectUF}>
                                <option value="0">Selecione uma UF</option>
                                {ufs.map(res => (
                                    <option key={res} value={res}>{res}</option>
                                ))}
                            </select>
                        </div>

                        <div className='field'>
                            <label htmlFor="city">Cidade</label>
                            <select name="city" id="city" value={selectedCity} onChange={handSelectCity}>
                                <option value="0">Selecione uma Cidade</option>
                                {cities.map(res => (
                                    <option key={res} value={res}>{res}</option>
                                ))}
                            </select>
                        </div>

                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Ítens de Coleta</h2>
                        <span>Seleciona um ou mais itens de coleta</span>
                    </legend>

                    <ul className="items-grid">
                        { items.map(item => (
                            <li 
                                key={item.id} 
                                onClick={() => handSelectItem(item.id)}
                                className={selectedItems.includes(item.id) ? 'selected' : ''}
                            >
                            <img src={ item.image_url } alt={ item.title} />
                            <span>{ item.title }</span>
                        </li>
                        ))}
                        
                    </ul>
                </fieldset>

                <button type="submit">
                    Cadastrar ponto de Coleta
                </button>
            </form>
        </div>
    );
};

export default CreatePoint;