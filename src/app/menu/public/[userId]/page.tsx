'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getDishes } from '@/lib/database';
import { Dish } from '@/types';
import { useParams, useSearchParams } from 'next/navigation';

// =================================================================
// TIPOS
// =================================================================
interface ItemCarrinho {
    nome: string;
    preco: number;
    qty: number;
}

interface RestauranteConfig {
    nome_restaurante: string;
    bg_color: string;
    primary_color: string;
    accent_color: string;
    currency: string;
    layout_style: string;
}


// =================================================================
// ESTILOS
// =================================================================
function gerarEstilos(config: RestauranteConfig) {
    const accent = config.accent_color || '#2ecc71';
    const primary = config.primary_color || '#2c3e50';
    const bg = config.bg_color || '#f9f9f9';

    return {
        pagina: { backgroundColor: bg, minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif', color: '#333', paddingBottom: '80px' } as React.CSSProperties,
        header: { backgroundColor: primary, color: 'white', padding: '20px', textAlign: 'center' as const },
        headerTitulo: { fontSize: '2rem', margin: 0, color: 'white' },
        headerSub: { margin: '8px 0 0 0', opacity: 0.85 },
        conteudo: { maxWidth: '800px', margin: '0 auto', padding: '30px 20px' },
        menuSecao: { marginBottom: '30px' },
        secaoTitulo: { fontSize: '1.5rem', borderBottom: `2px solid ${accent}`, paddingBottom: '5px', marginBottom: '20px', color: primary },
        menuGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' },
        card: (layoutStyle: string) => ({ background: 'white', display: 'flex', flexDirection: 'column' as const, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: `5px solid ${accent}`, borderRadius: layoutStyle === 'classic' ? '0px' : layoutStyle === 'rustic' ? '16px' : '8px', overflow: 'hidden' }),
        cardImagem: { width: '100%', height: '180px', objectFit: 'cover' as const, display: 'block' },
        cardImagemPlaceholder: { width: '100%', height: '180px', background: 'linear-gradient(135deg, #ecf0f1, #bdc3c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#95a5a6', fontSize: '2rem' },
        cardBody: { padding: '15px 20px 20px 20px', display: 'flex', flexDirection: 'column' as const, flex: 1 },
        cardNome: { fontSize: '1.1rem', margin: '0 0 4px 0' },
        cardDesc: { fontSize: '0.875rem', color: '#7f8c8d', lineHeight: '1.4', margin: 0 },
        cardAcoes: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' },
        cardPreco: { fontWeight: 'bold' as const, fontSize: '1.15rem', color: accent },
        btnPedir: { backgroundColor: '#e67e22', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' as const },
        cartFooter: { position: 'fixed' as const, bottom: 0, left: 0, right: 0, backgroundColor: '#e67e22', color: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', zIndex: 99 },
        cartOverlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300 },
        cartDrawer: { position: 'fixed' as const, bottom: 0, left: 0, right: 0, background: 'white', borderRadius: '20px 20px 0 0', boxShadow: '0 -8px 30px rgba(0,0,0,0.15)', zIndex: 301, maxHeight: '85vh', display: 'flex', flexDirection: 'column' as const },
        cartHandle: { width: '40px', height: '4px', background: '#ddd', borderRadius: '2px', margin: '12px auto 0 auto' },
        cartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px 12px 24px', borderBottom: '1px solid #eee' },
        cartHeaderTitulo: { fontSize: '1.2rem', color: '#2c3e50', margin: 0 },
        btnFecharCart: { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#7f8c8d' },
        cartLista: { overflowY: 'auto' as const, flex: 1, padding: '12px 24px' },
        cartVazio: { textAlign: 'center' as const, color: '#95a5a6', padding: '40px 0' },
        cartRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f5f5f5', gap: '10px' },
        cartRowNome: { fontWeight: '600' as const, fontSize: '0.95rem', color: '#2c3e50' },
        cartRowPreco: { fontSize: '0.875rem', color: '#7f8c8d', marginTop: '2px' },
        cartRowQty: { display: 'flex', alignItems: 'center', gap: '8px' },
        btnQty: (remover: boolean) => ({ width: '28px', height: '28px', borderRadius: '50%', border: remover ? '2px solid #e74c3c' : '2px solid #e0e0e0', background: 'white', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold' as const, display: 'flex', alignItems: 'center', justifyContent: 'center', color: remover ? '#e74c3c' : '#2c3e50' }),
        qtyNumero: { fontWeight: '700' as const, fontSize: '1rem', minWidth: '20px', textAlign: 'center' as const },
        cartFooterDrawer: { padding: '16px 24px', borderTop: '1px solid #eee', background: 'white' },
        cartSubtotal: { display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '700' as const, color: '#2c3e50', marginBottom: '14px' },
        btnEnviar: (disabled: boolean) => ({ width: '100%', padding: '14px', background: disabled ? '#bdc3c7' : '#2ecc71', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.05rem', fontWeight: 'bold' as const, cursor: disabled ? 'not-allowed' : 'pointer' }),
        vazio: { textAlign: 'center' as const, padding: '60px 20px', color: '#999' },
    };
}


// =================================================================
// COMPONENTE PRINCIPAL
// =================================================================
export default function MenuPublico() {
    const params = useParams();
    const userId = params?.userId as string;
    const searchParams = useSearchParams();
    const numeromesa = searchParams.get('table');

    const [dishes, setDishes] = useState<Dish[]>([]);
    const [config, setConfig] = useState<RestauranteConfig>({ nome_restaurante: '', bg_color: '#f9f9f9', primary_color: '#2c3e50', accent_color: '#2ecc71', currency: '€', layout_style: 'modern' });
    const [loading, setLoading] = useState(true);
    const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
    const [carrinhoAberto, setCarrinhoAberto] = useState(false);
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        if (!userId) return;

        async function carregar() {
            setLoading(true);
            try {
                const [dishData, configData] = await Promise.all([
                    getDishes(userId),
                    supabase.from('restaurante_config').select('*').eq('user_id', userId).maybeSingle(),
                ]);
                setDishes(dishData);
                if (configData.data) setConfig(configData.data);
            } catch (err) {
                console.error('Erro ao carregar menu:', err);
            } finally {
                setLoading(false);
            }
        }

        carregar();
    }, [userId]);

    function adicionarAoCarrinho(dish: Dish) {
        setCarrinho(prev => {
            const existente = prev.find(i => i.nome === dish.name);
            if (existente) return prev.map(i => i.nome === dish.name ? { ...i, qty: i.qty + 1 } : i);
            return [...prev, { nome: dish.name, preco: dish.price, qty: 1 }];
        });
    }

    function alterarQty(nome: string, delta: number) {
        setCarrinho(prev => prev.map(i => i.nome === nome ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0));
    }

    const totalItens = carrinho.reduce((s, i) => s + i.qty, 0);
    const totalPreco = carrinho.reduce((s, i) => s + i.preco * i.qty, 0);

    async function enviarPedido() {
        if (carrinho.length === 0) return;
        setEnviando(true);

        const itensFlatten = carrinho.flatMap(i => Array(i.qty).fill({ nome: i.nome, preco: i.preco }));

        const { error } = await supabase.from('pedidos').insert({
            user_id: userId,
            itens: JSON.stringify(itensFlatten),
            total: totalPreco,
            table_number: numeromesa || null,  // ← adiciona esta linha
        });

        setEnviando(false);

        if (!error) {
            setCarrinho([]);
            setCarrinhoAberto(false);
            alert('Pedido enviado para a cozinha! ✅');
        } else {
            alert('Erro ao enviar pedido: ' + error.message);
        }
    }

    const categorias = dishes.reduce((acc, dish) => {
        const cat = dish.category || 'Geral';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(dish);
        return acc;
    }, {} as Record<string, Dish[]>);

    const css = gerarEstilos(config);

    if (loading) {
        return (
            <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: config.bg_color }}>
                <p style={{ fontSize: '1.2rem', color: '#666' }}>A carregar menu...</p>
            </div>
        );
    }

    return (
        <div style={css.pagina}>
            {/* CABEÇALHO */}
            <header style={css.header}>
                <h1 style={css.headerTitulo}>{config.nome_restaurante || 'Menu Digital'}</h1>
                <p style={css.headerSub}>Faça o seu pedido diretamente pelo site!</p>
            </header>

            {/* PRATOS */}
            <div style={css.conteudo}>
                {Object.keys(categorias).length === 0 ? (
                    <p style={css.vazio}>Nenhum prato disponível.</p>
                ) : (
                    Object.entries(categorias).map(([cat, pratos]) => (
                        <section key={cat} style={css.menuSecao}>
                            <h2 style={css.secaoTitulo}>{cat}</h2>
                            <div style={css.menuGrid}>
                                {pratos.map(dish => (
                                    <div key={dish.id} style={css.card(config.layout_style)}>
                                        {dish.image_url
                                            ? <img src={dish.image_url} alt={dish.name} style={css.cardImagem} onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                                            : <div style={css.cardImagemPlaceholder}>🍽️</div>
                                        }
                                        <div style={css.cardBody}>
                                            <h3 style={css.cardNome}>{dish.name}</h3>
                                            <p style={css.cardDesc}>{dish.description}</p>
                                            <div style={css.cardAcoes}>
                                                <span style={css.cardPreco}>{config.currency} {dish.price.toFixed(2)}</span>
                                                <button style={css.btnPedir} onClick={() => adicionarAoCarrinho(dish)}>+ Pedir</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))
                )}
            </div>

            {/* BARRA DO CARRINHO */}
            {totalItens > 0 && (
                <div style={css.cartFooter} onClick={() => setCarrinhoAberto(true)}>
                    <span>🛒 {totalItens} item(ns) — toque para editar</span>
                    <span>{config.currency} {totalPreco.toFixed(2)}</span>
                </div>
            )}

            {/* DRAWER DO CARRINHO */}
            {carrinhoAberto && (
                <>
                    <div style={css.cartOverlay} onClick={() => setCarrinhoAberto(false)} />
                    <div style={css.cartDrawer}>
                        <div style={css.cartHandle} />
                        <div style={css.cartHeader}>
                            <h3 style={css.cartHeaderTitulo}>🛒 O seu Pedido</h3>
                            <button style={css.btnFecharCart} onClick={() => setCarrinhoAberto(false)}>×</button>
                        </div>
                        <div style={css.cartLista}>
                            {carrinho.length === 0 ? (
                                <p style={css.cartVazio}>O carrinho está vazio.</p>
                            ) : (
                                carrinho.map(item => (
                                    <div key={item.nome} style={css.cartRow}>
                                        <div>
                                            <div style={css.cartRowNome}>{item.nome}</div>
                                            <div style={css.cartRowPreco}>{config.currency} {(item.preco * item.qty).toFixed(2)}</div>
                                        </div>
                                        <div style={css.cartRowQty}>
                                            <button style={css.btnQty(true)} onClick={() => alterarQty(item.nome, -1)}>−</button>
                                            <span style={css.qtyNumero}>{item.qty}</span>
                                            <button style={css.btnQty(false)} onClick={() => alterarQty(item.nome, 1)}>+</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div style={css.cartFooterDrawer}>
                            <div style={css.cartSubtotal}>
                                <span>Total</span>
                                <span>{config.currency} {totalPreco.toFixed(2)}</span>
                            </div>
                            <button
                                style={css.btnEnviar(carrinho.length === 0 || enviando)}
                                onClick={enviarPedido}
                                disabled={carrinho.length === 0 || enviando}
                            >
                                {enviando ? 'A enviar...' : 'Enviar Pedido para a Cozinha 🍳'}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}