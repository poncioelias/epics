$( document ).ready(function() {

    //configurando mascaras de entradas
    $("#cep").mask("99.999-999");    
    $('#cc-number').payment('formatCardNumber');
    $('#cc-expiration').payment('formatCardExpiry');
    $('#cc-cvv').payment('formatCardCVC');

});


//renderizar ítens no template
$.getJSON('fonts/products.json', function (item) { 

    template = $('#item-template').html();
    output = Mustache.render(template, item);
    $("#containe_item").append(output);

    //somar total de produtos
    total = 0
    $( ".valor_total" ).each(function(  ) {
        total = total + parseInt($(this).text())
    });

    $(".totalprod").html(total)

});

//finalizando etapa de dados pessoais
$( "button[name=btn_etapa1]" ).on( "click" , function () {

    //obtendo nome e email
    var nome = $("#nome").val();
    var email = $("#email").val();
    
    $("#id-msg").attr("hidden", true)

    //validar preenchimento
    if (nome != ""){

        if (email != ""){

            var validaemail = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
            
            if (validaemail.test(email)) {
                //ocultar form etapa1 e exibir 2
                $(".etapa1").attr("hidden",true)          
                $(".etapa2").attr("hidden",false)
                
            }else{

                show_alert('Formato email inválido');
            }

        }else{
            show_alert("O email deve ser informado");
        }        

    }else{
        show_alert("O nome deve ser informado");
    }

 });

 //finalizando etapa de dados de endereço
$( "button[name=btn_etapa2]" ).on( "click" , function () {

    //obtendo dados do form
    var cep = $("#cep").val().replace(/\D/g, '');
    var endereco = $("#endereco").val();
    var numero = $("#numero").val();
    var cidade = $("#cidade").val();
    var estado = $("#estado").val();

    $("#id-msg").attr("hidden", true)

    //validar cep
    if ( validarCep(cep) == true ){
        
        //validar endereco
        if ( endereco != "" ) {

            //validar cidade
            if ( cidade != "" ) {

                //validar estado
                if ( estado != "" ) {

                   //ocultar form etapa1 e exibir 2
                   $(".etapa2").attr("hidden",true)          
                   $(".etapa3").attr("hidden",false)                     
                    
                } else {
                    show_alert("O estado deve ser preenchido")
                }            

            } else {
                show_alert("O cidade deve ser preenchido")
            }            

        } else {
            show_alert("O endereço deve ser preenchido")
        }

    }
    

});

//finalizando etapa de dados de pagamento (somente opção com cartão de crédito)
$( "button[name=btn_concluir]" ).on( "click" , function () {

    var cc_nome = $("#cc-name").val();
    var cc_numero = $("#cc-number").val();
    var cc_exp = $("#cc-expiration").val();
    var cc_cvv = $("#cc-cvv").val();
    var cc_oper = $("#cc-oper").val();

    $("#id-msg").attr("hidden", true)

    var valid = $.payment.validateCardNumber(cc_numero);    
    
    if (cc_nome != "") {

        //validando o número do cartão
        if (valid) {

            //validando a data de expiração do cartão
            if ( $.payment.validateCardExpiry($.payment.cardExpiryVal(cc_exp)) ) {

                //validando o código de segurança do cartão 
                if ( $.payment.validateCardCVC(cc_cvv, cc_oper) ) {

                    $(".etapa3").attr("hidden",true)
                    $(".etapa4").attr("hidden",false)
                    
                } else {
                    show_alert("Código de segurança inválido")
                }

            } else {
                show_alert("Data de expiração vencida")
            }

        }else{
            show_alert("Número de cartão inválido")
        }
    
    } else {
        show_alert("Informe o nome do titular do cartão")
    }

});

//função para consultar endereço por cep
$( "input[name=cep]" ).on( "change" , function () {

    //capturando valor digitado
    var cep = $(this).val().replace(/\D/g, '');

    //validar cep
    if ( validarCep(cep) == true ){

        //Consulta o webservice viacep.com.br/
        $.getJSON("https://viacep.com.br/ws/"+ cep +"/json/?callback=?", function(dados) {
            if (!("erro" in dados)) {
                $("#endereco").val(dados.logradouro + "," + dados.bairro)
                $("#cidade").val(dados.localidade)
                $("#estado").val(dados.uf)
            }else{
                $("#endereco").val("")
                $("#cidade").val("")
                $("#estado").val("")                    
            }
        });

    }            

});

//função para consultar endereço por cep
$( "#cc-number" ).on( "change" , function () { 

    //obtendo a operadora
    var cc_numero = $(this).val();

    var oper = $.payment.cardType(cc_numero);

    if (oper != null){
        $("#cc-oper").val(oper);
    }else{
        $("#cc-oper").val("NC");
    }


} );

function add_qtd_prod(id){ 
    
    //id elemento
    var input_id = $(id).attr("id").split("_")[2]

    //qtd digitado    
    var qtd = parseInt($(id).val())
    
    //obtendo valor unitário
    valor_unid = parseFloat($(".valor_desconto_"+input_id+" strong").text())

    //valor total atual
    valor_total_atual = parseFloat($(".valor_total_"+input_id).text())

    //valor resumo atual
    valor_resumo_atual = parseFloat($(".totalprod").text())

    //calculando novo valor do resumo do carrinho
    novo_valor_resumo = (valor_resumo_atual-valor_total_atual) + (valor_unid * qtd) 

    //calculando novo valor total do ítem
    novo_valor_item = (valor_unid * qtd)

    //atribuindo novos valores aos elementos
    $(".totalprod").text(novo_valor_resumo) 
    $(".valor_total_"+input_id).text(novo_valor_item)

}

//função utilizada para remover um ítem do carrinho
function remove_item(id){ 

    //id elemento
    var input_id = $(id).attr("id").split("_")[2]
    
    //valor total atual
    valor_total_atual = parseFloat($(".valor_total_"+input_id).text())

    //valor resumo atual
    valor_resumo_atual = parseFloat($(".totalprod").text())

    //calculando novo valor do resumo do carrinho
    novo_valor_resumo = (valor_resumo_atual-valor_total_atual) 

    $(".totalprod").text(novo_valor_resumo) 
    $("#div_prod_"+input_id).remove()

} 

//função utilizada para validar o cep
function validarCep(cep){

    //verifica se o campo possui valor
    if ( cep != "" ){

        //Expressão regular para validar o CEP.
        var validacep = /^[0-9]{8}$/;

        //Valida o formato do CEP.
        if(validacep.test(cep)) {     
            return true
        } else {
            $("#cep").val("");
            show_alert("Formato de CEP inválido")            
        }       

    } else {
        show_alert("O CEP deve ser informado")
    }
}

//metodo para voltar uma etapa dopagamento
function vontar_etapa_pagamento(etapa){

    $("#id-msg").attr("hidden", true)    
    $(".etapa"+etapa).attr("hidden",true)
    $(".etapa"+(parseInt(etapa)-1)).attr("hidden",false)

}


function show_alert(msg){

    $("#id-msg").attr("hidden", false)
    $("#id-msg div").html(msg)

}

